import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Tu configuración de Firebase, leyendo desde el archivo .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa Firebase (esta lógica evita que se reinicie en cada recarga)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta los servicios que usarás en tu app
const auth = getAuth(app); // Esta es tu conexión a Authentication
const db = getFirestore(app); // Esta es tu conexión a Firestore (la base de datos)

export { app, auth, db };