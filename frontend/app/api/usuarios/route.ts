// app/api/usuarios/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { adminDb, admin } from '../../../lib/firebase-admin'; // Usa la ruta relativa

// --- FUNCIÓN GET (Sigue igual) ---
export async function GET() {
  try {
    const usuariosSnapshot = await adminDb.collection('usuarios').get();
    const usuarios = usuariosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("Error en GET /api/usuarios:", error);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

// --- ¡FUNCIÓN POST (CORREGIDA)! ---
export async function POST(
  request: NextRequest // Asegúrate de que es NextRequest
) {
  
  // --- ¡NUEVO BLOQUE DE DEBUG! ---
  // Vamos a atrapar el error de 'request.json()' por separado
  let body: any;
  try {
    body = await request.json();
    console.log("BODY RECIBIDO EN EL BACKEND:", body); // Log para ver qué recibe
  } catch (error) {
    console.error("FALLÓ AL LEER EL BODY (request.json):", error);
    return NextResponse.json({ error: 'El body de la solicitud no es JSON válido' }, { status: 400 });
  }
  // --- FIN DEL BLOQUE DE DEBUG ---

  try {
    // 1. Valida que los datos necesarios llegaron
    if (!body.email || !body.password || !body.nombre || !body.rol) {
      console.warn('Faltan datos en el body:', body); // Log de advertencia
      return NextResponse.json({ error: 'Faltan datos (email, password, nombre, rol)' }, { status: 400 });
    }

    console.log('POST /api/usuarios: Creando nuevo usuario...');
    
    // 2. Crea el usuario en Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: body.email,
      password: body.password,
      displayName: body.nombre,
      disabled: false,
    });

    console.log('Usuario creado en Auth, UID:', userRecord.uid);

    // 3. Prepara los datos para Firestore
    const datosUsuarioFirestore = {
      nombre: body.nombre,
      email: body.email,
      rol: body.rol,
      estado: "Activo",
    };

    // 4. Guarda los datos en Firestore
    await adminDb.collection('usuarios').doc(userRecord.uid).set(datosUsuarioFirestore);

    console.log('Datos de usuario guardados en Firestore');

    // 5. Responde con los datos del usuario creado
    return NextResponse.json({ id: userRecord.uid, ...datosUsuarioFirestore }, { status: 201 });

  } catch (error) {
    console.error("Error en POST /api/usuarios:", error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'El correo electrónico ya está en uso' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear el usuario', detalle: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}


// --- FUNCIÓN DELETE (Sigue igual) ---
export async function DELETE(
  request: NextRequest
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    if (!userId) {
      return NextResponse.json({ error: 'Falta el ID del usuario' }, { status: 400 });
    }

    await admin.auth().deleteUser(userId); 
    await adminDb.collection('usuarios').doc(userId).delete(); 

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' });

  } catch (error) {
    console.error("Error en DELETE /api/usuarios:", error);
    return NextResponse.json({ error: 'Error al eliminar el usuario' }, { status: 500 });
  }
}