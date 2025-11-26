/* eslint-disable no-undef */
// Service Worker para Firebase Cloud Messaging
// Recibe la configuración desde la app y maneja notificaciones en segundo plano.
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

let messaging = null;
let initialized = false;

const reportNotificationEvent = (logId, event, metadata) => {
  if (!logId) return;
  try {
    fetch('/api/notifications/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        logId,
        event,
        metadata: {
          source: 'service-worker',
          ...metadata,
        },
      }),
    }).catch((error) => {
      console.error('[firebase-messaging-sw] Error reportando evento', error);
    });
  } catch (error) {
    console.error('[firebase-messaging-sw] Error invocando evento', error);
  }
};

function initializeFirebase(config) {
  if (initialized) return;
  if (!config || !config.messagingSenderId) {
    console.warn('[firebase-messaging-sw] Configuración inválida. messagingSenderId requerido.', config);
    return;
  }

  console.debug('[firebase-messaging-sw] Inicializando Firebase con config:', config);

  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }

  messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw] Mensaje recibido en segundo plano', payload);

    const notificationTitle =
      payload.notification?.title || payload.data?.title || 'Ahorro365';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || '',
      // Icono opcional - usar imagen de la notificación si está disponible
      icon: payload.notification?.image || undefined,
      badge: payload.notification?.image || undefined,
      data: payload.data || {},
      image: payload.notification?.image,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);

    const logId = payload?.data?.logId;
    if (logId) {
      reportNotificationEvent(logId, 'delivered', { channel: 'background' });
    }
  });

  initialized = true;
}

self.addEventListener('message', (event) => {
  console.debug('[firebase-messaging-sw] Mensaje recibido', event.data);
  if (event.data?.type === 'INIT_FIREBASE_MESSAGING') {
    initializeFirebase(event.data.payload);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.debug('[firebase-messaging-sw] notificationclick', event.notification?.data);
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  const logId = event.notification?.data?.logId;
  const tasks = [self.clients.openWindow(url)];

  if (logId) {
    tasks.push(
      fetch('/api/notifications/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          logId,
          event: 'clicked',
          metadata: {
            source: 'notificationclick',
          },
        }),
      }).catch((error) => {
        console.error('[firebase-messaging-sw] Error reportando click', error);
      })
    );
  }

  event.waitUntil(Promise.all(tasks));
});

self.addEventListener('notificationclose', (event) => {
  const logId = event.notification?.data?.logId;
  if (!logId) return;
  event.waitUntil(
    fetch('/api/notifications/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        logId,
        event: 'dismissed',
        metadata: {
          source: 'notificationclose',
        },
      }),
    }).catch((error) => {
      console.error('[firebase-messaging-sw] Error reportando dismiss', error);
    })
  );
});

