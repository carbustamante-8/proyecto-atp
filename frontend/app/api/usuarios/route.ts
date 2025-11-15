// frontend/app/api/usuarios/route.ts
// (CÓDIGO CORREGIDO: Arregladas las importaciones y los tipos en GET)

import { NextResponse, NextRequest } from 'next/server';
// --- ¡IMPORTACIONES CORREGIDAS! ---
import { adminDb, adminAuth } from '@/lib/firebase-admin'; // Usamos el alias de ruta
import * as admin from 'firebase-admin'; // Importamos 'admin' por separado
// --- FIN DE LA CORRECCIÓN ---

/**
 * Función GET: (¡CORREGIDA!)
 * Ya no usa .toJSON() y maneja los tipos de UserRecord correctamente.
 */
export async function GET() {
  try {
    const listUsersResult = await adminAuth.listUsers();
    
    // --- ¡CORRECCIÓN DE TIPOS! ---
    // 'users' es ahora un array de 'UserRecord'
    const users = listUsersResult.users;
    
    // Carga los datos de Firestore (sin cambios)
    const firestoreSnapshot = await adminDb.collection('usuarios').get();
    const firestoreData: { [key: string]: any } = {};
    firestoreSnapshot.forEach(doc => {
      firestoreData[doc.id] = doc.data();
    });

    // Combina los datos de Auth y Firestore
    // 'user' ahora es de tipo 'UserRecord', que SÍ tiene 'uid' y 'email'.
    const combinedUsers = users.map(user => {
      const profile = firestoreData[user.uid];
      return {
        id: user.uid,
        email: user.email || 'N/A', // Email es opcional en UserRecord
        nombre: profile?.nombre || 'N/A',
        rol: profile?.rol || 'N/A',
        estado: profile?.estado || 'N/A',
      };
    });
    // --- FIN DE LA CORRECCIÓN ---

    return NextResponse.json(combinedUsers);
  } catch (error) {
    console.error("Error en GET /api/usuarios:", error);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

/**
 * Función POST: (Sin cambios en la lógica)
 * Se ejecuta cuando el Admin crea un nuevo usuario.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nombre, rut, rol, estado } = body;

    if (!email || !password || !nombre || !rol) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // 1. Crear usuario en Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: nombre,
    });

    // 2. Crear perfil de usuario en Firestore con el MISMO ID
    await adminDb.collection('usuarios').doc(userRecord.uid).set({
      nombre: nombre,
      email: email,
      rut: rut || '',
      rol: rol,
      estado: estado || 'Activo',
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(), // ¡Ahora 'admin' está definido!
      id_vehiculo_asignado: null,
    });
    
    return NextResponse.json({ id: userRecord.uid, ...body }, { status: 201 });

  } catch (error: any) {
    console.error("Error al crear el usuario:", error);
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'El correo electrónico ya está en uso' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear el usuario', details: error.message }, { status: 500 });
  }
}