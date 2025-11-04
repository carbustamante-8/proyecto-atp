// app/api/usuarios/route.ts

import { NextResponse } from 'next/server';
// 1. IMPORTA LA LLAVE MAESTRA (Conexión Admin)
import { adminDb } from '@/lib/firebase-admin';

/**
 * Función GET: Se ejecuta cuando tu vista de "Admin Usuarios"
 * pida la lista de usuarios.
 */
export async function GET() {
  try {
    console.log('GET /api/usuarios: Obteniendo lista de usuarios...');

    // 2. USA LA CONEXIÓN ADMIN para hablar con Firestore
    // Esto va a la "colección" (tabla) llamada "usuarios"
    const usuariosSnapshot = await adminDb.collection('usuarios').get();

    // 3. Convierte los datos a un formato JSON simple
    const usuarios = usuariosSnapshot.docs.map(doc => ({
      id: doc.id, // El ID único del documento
      ...doc.data(), // El resto de los datos (nombre, email, rol, etc.)
    }));

    // 4. Responde con la lista de usuarios
    return NextResponse.json(usuarios);

  } catch (error) {
    console.error("Error en GET /api/usuarios:", error);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}


/**
 * Función POST: Se ejecuta cuando tu formulario "Crear Nuevo Usuario"
 * envíe los datos.
 */
export async function POST(request: Request) {
  try {
    // 1. Lee los datos que envió el formulario (Nombre, Email, Rol, etc.)
    const body = await request.json(); 
    
    console.log('POST /api/usuarios: Creando nuevo usuario...');
    console.log('Datos recibidos:', body);

    // 2. USA LA CONEXIÓN ADMIN para CREAR un nuevo documento en Firestore
    const nuevoUsuarioRef = await adminDb.collection('usuarios').add({
      nombre: body.nombre,
      email: body.email,
      rol: body.rol,
      estado: "Activo", // Puedes poner un estado por defecto
      // NOTA: La contraseña no se guarda aquí, se guarda en "Authentication"
    });

    // 3. Responde con los datos del usuario creado
    return NextResponse.json({ id: nuevoUsuarioRef.id, ...body }, { status: 201 });

  } catch (error) {
    console.error("Error en POST /api/usuarios:", error);
    return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 });
  }
}