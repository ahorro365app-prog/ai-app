import { useEffect } from 'react';
import { initFirebaseClient, getFirebaseMessaging } from '@/lib/firebaseClient';
import { getToken, onMessage } from 'firebase/messaging';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useNotificationToast } from '@/contexts/NotificationToastContext';
import { logger } from '@/lib/logger';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { getApiBaseUrl } from '@/lib/apiConfig';

const FCM_PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export type FcmStatusPayload = {
  status: 'unknown' | 'pending' | 'registered' | 'denied' | 'error' | 'unsupported' | 'signed_out';
  permission: NotificationPermission | 'unsupported';
  token?: string;
  lastRegisteredAt?: string;
  error?: string;
  reason?: string;
};

export const FCM_STATUS_STORAGE_KEY = 'ahorro365:fcmStatus';

const saveStatus = (payload: FcmStatusPayload) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FCM_STATUS_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent<FcmStatusPayload>('fcm-status-changed', { detail: payload }));
  } catch (error) {
    logger.error('Error guardando estado de notificaciones:', error);
  }
};

export function useRegisterFcmToken() {
  const { user } = useSupabase();
  const { showToast } = useNotificationToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentPermission =
      typeof Notification !== 'undefined' ? Notification.permission : ('unsupported' as const);

    if (!user) {
      saveStatus({
        status: 'signed_out',
        permission: currentPermission,
      });
      return;
    }

    // Detectar si estamos en móvil (Capacitor)
    const isMobile = Capacitor.isNativePlatform();
    
    if (isMobile) {
      // Registrar token para móvil (Android/iOS)
      registerMobileToken();
      return;
    }

    // Código para web (navegador)
    if (typeof Notification === 'undefined') {
      logger.warn('El navegador no soporta notificaciones push.');
      saveStatus({
        status: 'unsupported',
        permission: 'unsupported',
        reason: 'El navegador no soporta la API de Notificaciones.',
      });
      return;
    }
    if (!('serviceWorker' in navigator)) {
      logger.warn('El navegador no soporta service workers. Notificaciones push deshabilitadas.');
      saveStatus({
        status: 'unsupported',
        permission: currentPermission,
        reason: 'Este navegador no soporta Service Workers.',
      });
      return;
    }

    const firebaseApp = initFirebaseClient();
    if (!firebaseApp) return;

    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    if (!FCM_PUBLIC_VAPID_KEY) {
      logger.warn('NEXT_PUBLIC_FIREBASE_VAPID_KEY no está configurada. Notificaciones push deshabilitadas.');
      saveStatus({
        status: 'error',
        permission: currentPermission,
        error: 'NEXT_PUBLIC_FIREBASE_VAPID_KEY no está configurada',
      });
      return;
    }

    let isMounted = true;

    const registerToken = async () => {
      try {
        saveStatus({
          status: 'pending',
          permission: Notification.permission,
        });

        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
          logger.warn('Permisos de notificación no otorgados:', permission);
          saveStatus({
            status: permission === 'denied' ? 'denied' : 'pending',
            permission,
            reason:
              permission === 'denied'
                ? 'Debes habilitar las notificaciones desde la configuración del navegador.'
                : undefined,
          });
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
          vapidKey: FCM_PUBLIC_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (!token) {
          logger.warn('No se obtuvo token FCM.');
          saveStatus({
            status: 'error',
            permission,
            error: 'No se pudo obtener un token de Firebase.',
          });
          return;
        }

        if (!isMounted) return;

        // Sanitizar token para logs (mostrar solo primeros y últimos caracteres)
        const sanitizedToken = token ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : 'null';
        logger.debug('FCM token obtenido:', sanitizedToken);
        saveStatus({
          status: 'pending',
          permission,
          token,
        });

        const response = await fetch('/api/notifications/register-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            userId: user.id,
            deviceType: 'web',
            appVersion: process.env.NEXT_PUBLIC_APP_VERSION || 'web',
            osVersion: navigator.userAgent,
          }),
        });

        const responseBody = await response.json().catch(() => null);

        if (!response.ok || !responseBody?.success) {
          const message =
            responseBody?.message ||
            (typeof responseBody === 'string' ? responseBody : null) ||
            `HTTP ${response.status}`;
          throw new Error(message);
        }

        saveStatus({
          status: 'registered',
          permission,
          token,
          lastRegisteredAt: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Error registrando token FCM:', error);
        saveStatus({
          status: 'error',
          permission:
            typeof Notification !== 'undefined' ? Notification.permission : ('unsupported' as const),
          error: error instanceof Error ? error.message : 'Error desconocido registrando token.',
        });
      }
    };

    registerToken();

    const unsubscribe = onMessage(messaging, (payload) => {
      logger.debug('Notificación recibida en foreground:', payload);
      
      // Mostrar notificación visualmente cuando la app está en primer plano
      const hasNotificationAPI = typeof Notification !== 'undefined';
      const permission = hasNotificationAPI ? Notification.permission : 'unsupported';
      
      logger.debug('🔔 Estado de notificaciones:', {
        hasNotificationAPI,
        permission,
        canShow: hasNotificationAPI && permission === 'granted',
      });
      
      if (hasNotificationAPI && permission === 'granted') {
        const notificationTitle =
          payload.notification?.title || payload.data?.title || 'Ahorro365';
        const notificationBody =
          payload.notification?.body || payload.data?.body || 'Nueva notificación';
        
        const notificationOptions: NotificationOptions = {
          body: notificationBody,
          // Icono opcional - el navegador usará uno por defecto si no existe
          icon: payload.notification?.image || undefined,
          badge: payload.notification?.image || undefined,
          data: payload.data || {},
          image: payload.notification?.image,
          tag: payload.data?.logId || 'notification',
          requireInteraction: false,
          // Hacer la notificación más visible
          vibrate: [200, 100, 200], // Vibración en dispositivos móviles
          silent: false, // Asegurar que haga sonido
        };

        logger.debug('🔔 Intentando mostrar notificación:', {
          title: notificationTitle,
          body: notificationBody,
          options: notificationOptions,
        });

        try {
          const notification = new Notification(notificationTitle, notificationOptions);
          logger.debug('✅ Notificación creada exitosamente:', notification);
          
          // También mostrar toast en la página para garantizar visibilidad
          showToast(notificationTitle, notificationBody);
          logger.debug('🔔 Toast mostrado en la página');
          
          // Cerrar automáticamente después de 10 segundos (aumentado de 5 a 10)
          setTimeout(() => {
            notification.close();
            logger.debug('🔔 Notificación cerrada automáticamente');
          }, 10000);

          // Manejar click en la notificación
          notification.onclick = (event) => {
            logger.debug('🔔 Notificación clickeada');
            event.preventDefault();
            notification.close();
            const url = payload.data?.url || '/';
            window.focus();
            window.location.href = url;
          };

          notification.onshow = () => {
            logger.debug('🔔 Notificación mostrada visualmente');
          };

          notification.onerror = (error) => {
            logger.error('❌ Error en notificación:', error);
          };
        } catch (error) {
          logger.error('❌ Error mostrando notificación en foreground:', error);
        }
      } else {
        logger.warn('⚠️ No se puede mostrar notificación del navegador:', {
          reason: !hasNotificationAPI ? 'API no disponible' : `Permiso: ${permission}`,
          suggestion: permission === 'default' ? 'Solicitar permiso al usuario' : 'Verificar configuración del navegador',
        });
        
        // Aún así mostrar toast en la página
        const notificationTitle =
          payload.notification?.title || payload.data?.title || 'Ahorro365';
        const notificationBody =
          payload.notification?.body || payload.data?.body || 'Nueva notificación';
        showToast(notificationTitle, notificationBody);
        logger.debug('🔔 Toast mostrado en la página (fallback)');
      }
      
      const logId = payload?.data?.logId;
      if (logId) {
        fetch('/api/notifications/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            logId,
            event: 'delivered',
            metadata: {
              source: 'foreground',
            },
          }),
        }).catch((error) => {
          logger.error('Error reportando evento delivered (foreground):', error);
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user, showToast]);

  // Función para registrar token en móvil (Android/iOS)
  const registerMobileToken = async () => {
    try {
      saveStatus({
        status: 'pending',
        permission: 'granted', // En móvil, el permiso se maneja diferente
      });

      // Solicitar permisos
      logger.debug('Verificando permisos de notificaciones...');
      let permStatus = await PushNotifications.checkPermissions();
      logger.debug('Estado inicial de permisos:', permStatus);
      
      if (permStatus.receive !== 'granted') {
        logger.debug('Permisos no otorgados, solicitando...');
        permStatus = await PushNotifications.requestPermissions();
        logger.debug('Resultado de solicitud de permisos:', permStatus);
      } else {
        logger.debug('Permisos ya otorgados, continuando...');
      }

      if (permStatus.receive !== 'granted') {
        logger.warn('Permisos de notificación no otorgados en móvil:', permStatus);
        saveStatus({
          status: 'denied',
          permission: 'denied',
          reason: 'Debes habilitar las notificaciones desde la configuración del dispositivo.',
        });
        return;
      }

      logger.debug('Permisos otorgados, procediendo con registro...');

      // Función para registrar el token en el backend
      const registerTokenInBackend = async (token: string) => {
        if (!token) {
          logger.warn('No se obtuvo token FCM en móvil.');
          saveStatus({
            status: 'error',
            permission: 'granted',
            error: 'No se pudo obtener un token de Firebase.',
          });
          return;
        }

        // Sanitizar token para logs
        const sanitizedToken = token ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : 'null';
        logger.debug('FCM token obtenido en móvil:', sanitizedToken);

        saveStatus({
          status: 'pending',
          permission: 'granted',
          token,
        });

        // Registrar token en el backend
        try {
          // En móvil, usar la URL del core-api; en web, usar ruta relativa
          // Usar función centralizada para obtener URL del API
          const apiBaseUrl = getApiBaseUrl();
          const apiUrl = Capacitor.isNativePlatform()
            ? `${apiBaseUrl}/api/notifications/register-token`
            : '/api/notifications/register-token';

          logger.debug('Registrando token en:', apiUrl);

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token,
              userId: user.id,
              deviceType: Capacitor.getPlatform(), // 'android' o 'ios'
              appVersion: process.env.NEXT_PUBLIC_APP_VERSION || 'mobile',
              osVersion: Capacitor.getPlatform(),
            }),
          });

          const responseBody = await response.json().catch(() => null);

          if (!response.ok || !responseBody?.success) {
            const message =
              responseBody?.message ||
              (typeof responseBody === 'string' ? responseBody : null) ||
              `HTTP ${response.status}`;
            logger.error('Error en respuesta del servidor:', {
              status: response.status,
              message,
              responseBody,
            });
            throw new Error(message);
          }

          logger.debug('Token registrado exitosamente en backend');
          saveStatus({
            status: 'registered',
            permission: 'granted',
            token,
            lastRegisteredAt: new Date().toISOString(),
          });
        } catch (error) {
          logger.error('Error registrando token FCM en móvil:', error);
          saveStatus({
            status: 'error',
            permission: 'granted',
            error: error instanceof Error ? error.message : 'Error desconocido registrando token.',
          });
        }
      };

      // IMPORTANTE: Agregar listeners ANTES de registrar
      // El token puede llegar inmediatamente después de register()
      
      // Escuchar cuando se recibe el token
      const registrationListener = PushNotifications.addListener('registration', async (tokenResult) => {
        logger.debug('Evento registration recibido:', {
          hasToken: !!tokenResult.value,
          tokenLength: tokenResult.value?.length || 0,
        });
        const token = tokenResult.value;
        await registerTokenInBackend(token);
      });

      // Escuchar errores de registro
      const errorListener = PushNotifications.addListener('registrationError', (error) => {
        logger.error('Error registrando push notifications en móvil:', {
          error: error.error,
          message: error.message,
          fullError: error,
        });
        saveStatus({
          status: 'error',
          permission: 'granted',
          error: error.error || 'Error registrando notificaciones push.',
        });
      });

      // Registrar para recibir notificaciones push (DESPUÉS de agregar listeners)
      logger.debug('Registrando PushNotifications...');
      try {
        await PushNotifications.register();
        logger.debug('PushNotifications.register() completado exitosamente');
        
        // Esperar un poco para ver si el token llega inmediatamente
        setTimeout(() => {
          logger.debug('Verificando si el token llegó después de register()...');
        }, 2000);
      } catch (error) {
        logger.error('Error al llamar PushNotifications.register():', error);
        saveStatus({
          status: 'error',
          permission: 'granted',
          error: error instanceof Error ? error.message : 'Error al registrar notificaciones push.',
        });
      }

      // Escuchar cuando llega una notificación (foreground)
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        logger.debug('Notificación recibida en foreground (móvil):', notification);
        
        const title = notification.title || 'Ahorro365';
        const body = notification.body || 'Nueva notificación';
        
        // Mostrar toast en la app
        showToast(title, body);
      });

      // Escuchar cuando el usuario toca una notificación
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        logger.debug('Usuario tocó notificación (móvil):', action);
        
        const notification = action.notification;
        const logId = notification.data?.logId;
        
        if (logId) {
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
                source: 'mobile',
                platform: Capacitor.getPlatform(),
              },
            }),
          }).catch((error) => {
            logger.error('Error reportando evento clicked (móvil):', error);
          });
        }
      });

    } catch (error) {
      logger.error('Error inicializando push notifications en móvil:', error);
      saveStatus({
        status: 'error',
        permission: 'granted',
        error: error instanceof Error ? error.message : 'Error desconocido inicializando notificaciones.',
      });
    }
  };
}

