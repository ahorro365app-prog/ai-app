import admin from 'firebase-admin';

let isInitialized = admin.apps.length > 0;

if (!isInitialized) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey =
    privateKeyEnv?.includes('\\n')
      ? privateKeyEnv.replace(/\\n/g, '\n')
      : privateKeyEnv;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      'Firebase Admin SDK no se inicializó: faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY.'
    );
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    isInitialized = true;
  }
}

export const firebaseAdmin = admin;
export const firebaseAdminInitialized = isInitialized;
export const messaging = isInitialized ? admin.messaging() : null;

