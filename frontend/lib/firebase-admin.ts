// frontend/lib/firebase-admin.ts

import * as admin from 'firebase-admin';

// Declara la variable para la cuenta de servicio
let serviceAccount: admin.ServiceAccount;

try {
  // --- MODO PRODUCCIÓN (EN VERCEL) ---
  // Intenta leer la variable de entorno que configuraste en Vercel
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    
    // Parsea (convierte) el string JSON de la variable de entorno a un objeto
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  } 
  // --- MODO DESARROLLO (EN TU PC) ---
  else {
    
    // Si la variable no existe, busca el archivo .json local
    // (Este import solo se usará en tu PC, no en Vercel)
    const localServiceAccount = require('../firebase-service-account.json');
    serviceAccount = localServiceAccount;
  }

  // Inicializa la app de Admin (solo si no se ha hecho antes)
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

} catch (error) {
  console.error('Error al inicializar Firebase Admin:', error);
}

// Exporta la base de datos de admin
const adminDb = admin.firestore();

export { adminDb };