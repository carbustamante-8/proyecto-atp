// frontend/lib/firebase-admin.ts
// (CÓDIGO CORREGIDO: Añade validación para la variable de entorno)

import * as admin from 'firebase-admin';

// 1. Lee la variable de entorno
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
let app: admin.app.App;

// 2. Inicializa la app SÓLO SI el serviceAccount existe
if (!admin.apps.length) {
  if (serviceAccountString) {
    try {
      const serviceAccount = JSON.parse(serviceAccountString);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK inicializado correctamente.");
    } catch (error: any) {
      console.error('Error al inicializar Firebase Admin SDK (Revisa tu .env.local):', error.message);
    }
  } else {
    console.warn("ADVERTENCIA: La variable de entorno FIREBASE_SERVICE_ACCOUNT no está configurada. Las APIs de Admin fallarán.");
  }
} else {
  app = admin.app(); // Obtiene la app ya inicializada
}

// 3. Exporta las instancias
// (Esto fallará en las APIs si la inicialización no ocurrió, lo cual es esperado)
const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminDb, adminAuth };