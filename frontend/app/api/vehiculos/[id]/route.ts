// frontend/app/api/vehiculos/[id]/route.ts
// (CÓDIGO ACTUALIZADO: PUT ahora actualiza los 6 campos nuevos)

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
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
    
    const docRef = adminDb.collection('vehiculos').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) { 
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
  } catch (error: any) {
    console.error(`Error en GET /api/vehiculos/${(context.params as any).id}:`, error);
    return NextResponse.json({ error: 'Error al obtener el vehículo' }, { status: 500 });
  }
}

/**
 * Función PUT: (¡ACTUALIZADA!)
 * Ahora recibe y actualiza todos los campos, incluyendo los nuevos.
 */
export async function PUT(request: NextRequest, context: Context) {
  let id: string;
  try {
    const params = await context.params;
    id = params.id;
    const body = await request.json();

    // Excluimos 'patente' y 'id' del body, ya que no deben modificarse
    const { patente, id: bodyId, ...datosActualizados } = body; 
    
    // Asegura que el año sea un número
    if (datosActualizados.año) {
      datosActualizados.año = Number(datosActualizados.año);
    }
    
    // Asegura que el id_chofer_asignado sea null si está vacío
    if (datosActualizados.id_chofer_asignado === '') {
      datosActualizados.id_chofer_asignado = null;
    }

    // (Los 6 campos nuevos como 'color', 'vin', etc. 
    // ya vienen dentro de 'datosActualizados')

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