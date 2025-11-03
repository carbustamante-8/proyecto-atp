import * as admin from 'firebase-admin';

// Carga el archivo JSON de la cuenta de servicio que descargaste
// process.cwd() apunta a la raíz de 'frontend/'
const serviceAccount = require(process.cwd() + '/firebase-service-account.json');

// Inicializa la app de Admin (solo si no se ha hecho antes)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Exporta la base de datos de admin
const adminDb = admin.firestore();

export { adminDb };