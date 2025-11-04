// frontend/lib/firebase-admin.ts

import * as admin from 'firebase-admin';

let serviceAccount: admin.ServiceAccount;

// Esta es la comprobación clave:
// process.env.NODE_ENV === 'production' es VERDADERO en Vercel
// process.env.NODE_ENV === 'production' es FALSO en tu PC (npm run dev)
if (process.env.NODE_ENV === 'production') {
  
  // --- MODO PRODUCCIÓN (EN VERCEL) ---
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT no está configurada en Vercel.');
  }
  // Lee la variable de Vercel que pegaste
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

} else {
  
  // --- MODO DESARROLLO (EN TU PC) ---
  // Vercel ignorará este bloque 'else' durante el build
  // y no se quejará por el archivo .json que falta.
  serviceAccount = require('../firebase-service-account.json');
}

// Inicializa la app de Admin (solo si no se ha hecho antes)
if (!admin.apps.length) {
  admin.initializeApp({
    // @ts-ignore (Esto es por si TypeScript se queja del 'require')
    credential: admin.credential.cert(serviceAccount),
  });
}

// Exporta la base de datos de admin
const adminDb = admin.firestore();

export { adminDb };