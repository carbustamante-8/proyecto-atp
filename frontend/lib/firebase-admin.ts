// frontend/lib/firebase-admin.ts

import * as admin from 'firebase-admin';

let serviceAccount: admin.ServiceAccount;

if (process.env.NODE_ENV === 'production') {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT no está configurada en Vercel.');
  }
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require('../firebase-service-account.json');
}

if (!admin.apps.length) {
  admin.initializeApp({
    // @ts-ignore
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminDb = admin.firestore();

// --- ¡AQUÍ ESTÁ LA LÍNEA CLAVE DEL ARREGLO! ---
// Exporta 'adminDb' (la base de datos) Y 'admin' (el paquete completo)
export { adminDb, admin };