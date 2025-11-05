// app/api/usuarios/route.ts

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// --- 1. FUNCIÓN GET (YA EXISTÍA) ---
export async function GET() {
  try {
    console.log('GET /api/usuarios: Obteniendo lista de usuarios...');

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

// --- 2. FUNCIÓN POST (YA EXISTÍA) ---
export async function POST(request: Request) {
  try {
    const body = await request.json(); 
    
    console.log('POST /api/usuarios: Creando nuevo usuario...');

    const nuevoUsuarioRef = await adminDb.collection('usuarios').add({
      nombre: body.nombre,
      email: body.email,
      rol: body.rol,
      estado: "Activo",
    });

    return NextResponse.json({ id: nuevoUsuarioRef.id, ...body }, { status: 201 });

  } catch (error) {
    console.error("Error en POST /api/usuarios:", error);
    return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 });
  }
}

// --- 3. FUNCIÓN DELETE (LA QUE AÑADIMOS) ---
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'Falta el ID del usuario' }, { status: 400 });
    }

    console.log(`DELETE /api/usuarios: Borrando usuario con ID: ${userId}`);

    await adminDb.collection('usuarios').doc(userId).delete();

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' });

  } catch (error) {
    console.error("Error en DELETE /api/usuarios:", error);
    return NextResponse.json({ error: 'Error al eliminar el usuario' }, { status: 500 });
  }
}