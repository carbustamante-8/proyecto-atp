// frontend/app/api/vehiculos/[id]/route.ts
// (CÓDIGO CORREGIDO: Cambiado docSnap.exists() a docSnap.exists)

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

type Context = {
  params: Promise<{ id: string }>
}

/**
 * Función GET: (¡CORREGIDA!)
 * Usa la propiedad 'exists' (sin paréntesis) del Admin SDK.
 */
export async function GET(request: NextRequest, context: Context) {
  let id: string;
  try {
    const params = await context.params;
    id = params.id;
    
    const docRef = adminDb.collection('vehiculos').doc(id);
    const docSnap = await docRef.get();

    // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
    if (!docSnap.exists) { // Se quitan los paréntesis ()
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }
    // --- FIN DE LA CORRECCIÓN ---

    return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
  } catch (error: any) {
    console.error(`Error en GET /api/vehiculos/${(context.params as any).id}:`, error);
    return NextResponse.json({ error: 'Error al obtener el vehículo' }, { status: 500 });
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

    const { patente, ...datosActualizados } = body; 
    
    if (datosActualizados.año) {
      datosActualizados.año = Number(datosActualizados.año);
    }
    
    if (datosActualizados.id_chofer_asignado === '') {
      datosActualizados.id_chofer_asignado = null;
    }

    await adminDb.collection('vehiculos').doc(id).update(datosActualizados);
    
    return NextResponse.json({ message: 'Vehículo actualizado exitosamente' });
  } catch (error: any) {
    console.error(`Error en PUT /api/vehiculos/${(context.params as any).id}:`, error);
    return NextResponse.json({ error: 'Error al actualizar el vehículo', details: error.message }, { status: 500 });
  }
}

/**
 * Función DELETE: (Sin cambios)
 */
export async function DELETE(request: NextRequest, context: Context) {
  let id: string;
  try {
    const params = await context.params;
    id = params.id;

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID del vehículo' }, { status: 400 });
    }
    
    console.log(`DELETE /api/vehiculos: Intentando eliminar ID: ${id}`);
    
    await adminDb.collection('vehiculos').doc(id).delete();
    
    return NextResponse.json({ message: 'Vehículo eliminado' });

  } catch (error: any) {
    console.error(`Error en DELETE /api/vehiculos/${(context.params as any).id}:`, error);
    return NextResponse.json({ error: 'Error interno al eliminar el vehículo', details: error.message }, { status: 500 });
  }
}