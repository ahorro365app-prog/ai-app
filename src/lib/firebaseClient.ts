import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { getMessaging, Messaging } from 'firebase/messaging';
import { logger } from './logger';

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export function initFirebaseClient() {
  if (typeof window === 'undefined') return null;

  if (firebaseApp) return firebaseApp;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const OPTIONAL_FIELDS = ['measurementId'];
  const missingFields = Object.entries(config)
    .filter(([key, value]) => !value && !OPTIONAL_FIELDS.includes(key))
    .map(([key]) => key);

  if (missingFields.length > 0) {
    logger.warn(
      '[firebaseClient] Config incompleta. Faltan variables:',
      missingFields.join(', ')
    );
    return null;
  }

  firebaseApp = getApps().length ? getApps()[0] : initializeApp(config);

  if (!('serviceWorker' in navigator)) {
    logger.warn('El navegador no soporta service workers. Notificaciones push deshabilitadas.');
    return firebaseApp;
  }

  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      registration.update();

      const configForSw = {
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      };

      const sendMessage = (reg: ServiceWorkerRegistration | null) => {
        if (process.env.NODE_ENV !== 'production') {
          logger.debug('[firebaseClient] Enviando config al SW:', configForSw, 'registrationHasActive:', !!reg?.active);
        }
        reg?.active?.postMessage({
          type: 'INIT_FIREBASE_MESSAGING',
          payload: configForSw,
        });
      };

      sendMessage(registration);

      if (!registration.active) {
        navigator.serviceWorker.ready.then((readyRegistration) => {
          readyRegistration?.active?.postMessage({
            type: 'INIT_FIREBASE_MESSAGING',
            payload: configForSw,
          });
        });
      }
    })
    .catch((error) => {
      logger.error('Error registrando service worker de FCM:', error);
    });

  try {
    messaging = getMessaging(firebaseApp);
  } catch (error) {
    logger.error('Error obteniendo instancia de messaging:', error);
  }

  return firebaseApp;
}

export function getFirebaseMessaging() {
  if (!firebaseApp) {
    initFirebaseClient();
  }
  return messaging;
}

