// frontend/app/api/usuarios/[id]/route.ts
// (Este código ahora es correcto y funcionará)

import { NextResponse, NextRequest } from 'next/server';
// --- ¡Esta línea ahora funciona! ---
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

type Context = {
  params: Promise<{ id: string }>
}

/**
 * Función GET: (Sin cambios)
 */
export async function GET(request: NextRequest, context: Context) {
  let id: string;
  try {
    const params = await context.params;
    id = params.id;
    
    const docRef = adminDb.collection('usuarios').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) { 
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
  } catch (error: any) {
    console.error(`Error en GET /api/usuarios/${(context.params as any).id}:`, error);
    return NextResponse.json({ error: 'Error al obtener el usuario' }, { status: 500 });
  }
}

/**
 * Función PUT: (Sin cambios)
 */
export async function PUT(request: NextRequest, context: Context) {
  let id: string;
  try {
    const params = await context.params;
    id = params.id;
    const body = await request.json();

    const { email, ...datosActualizados } = body; 
    
    if (datosActualizados.rol === 'Conductor' && datosActualizados.id_vehiculo_asignado === '') {
      datosActualizados.id_vehiculo_asignado = null;
    }

    await adminDb.collection('usuarios').doc(id).update(datosActualizados);
    
    return NextResponse.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error: any) {
    console.error(`Error en PUT /api/usuarios/${(context.params as any).id}:`, error);
    return NextResponse.json({ error: 'Error al actualizar el usuario', details: error.message }, { status: 500 });
  }
}


/**
 * Función DELETE: (¡Ahora funciona!)
 * Usa 'adminAuth' para eliminar al usuario de Firebase Authentication.
 */
export async function DELETE(request: NextRequest, context: Context) {
  let id: string;
  try {
    const params = await context.params;
    id = params.id;

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID del usuario' }, { status: 400 });
    }
    
    console.log(`DELETE /api/usuarios: Iniciando eliminación completa de ID: ${id}`);
    
    // 1. Elimina el documento de Firestore
    await adminDb.collection('usuarios').doc(id).delete();
    
    // 2. Elimina el usuario de Firebase Authentication
    await adminAuth.deleteUser(id);
    
    return NextResponse.json({ message: 'Usuario eliminado' });

  } catch (error: any) {
    console.error(`Error en DELETE /api/usuarios/${(context.params as any).id}:`, error);
    return NextResponse.json({ error: 'Error al eliminar el usuario', details: error.message }, { status: 500 });
  }
}