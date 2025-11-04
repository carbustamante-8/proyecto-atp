// lib/firebase-admin.ts

import * as admin from 'firebase-admin';

// --- ¡ESTA ES LA LÍNEA CORREGIDA! ---
import serviceAccount from '../firebase-service-account.json';

// Inicializa la app de Admin (solo si no se ha hecho antes)
if (!admin.apps.length) {
  admin.initializeApp({
    // @ts-ignore (Esto es para que TypeScript no se queje del import)
    credential: admin.credential.cert(serviceAccount),
  });
}

// Exporta la base de datos de admin
const adminDb = admin.firestore();

export { adminDb };