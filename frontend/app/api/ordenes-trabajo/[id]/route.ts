// app/api/ordenes-trabajo/[id]/route.ts

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Función GET: Obtiene UNA Orden de Trabajo específica por su ID.
 * (La página "Detalle de OT" llamará a esto)
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id; // Obtiene el ID desde la URL (ej: /api/ordenes-trabajo/abc12345)
    
    const otDoc = await adminDb.collection('ordenes-trabajo').doc(id).get();

    if (!otDoc.exists) {
      return NextResponse.json({ error: 'OT no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ id: otDoc.id, ...otDoc.data() });

  } catch (error) {
    console.error(`Error en GET /api/ordenes-trabajo/${params.id}:`, error);
    return NextResponse.json({ error: 'Error al obtener la OT' }, { status: 500 });
  }
}


/**
 * Función PUT: Actualiza UNA Orden de Trabajo específica.
 * (El botón "Guardar Cambios" de la página de detalle llamará a esto)
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id; // Obtiene el ID desde la URL
    const body = await request.json(); // Obtiene los datos a actualizar (ej: { estado: "En Progreso" })

    console.log(`PUT /api/ordenes-trabajo/${id}: Actualizando OT...`);
    console.log('Datos recibidos:', body);

    const otRef = adminDb.collection('ordenes-trabajo').doc(id);

    // Actualiza el documento en Firestore
    await otRef.update({
      estado: body.estado, // Actualiza solo el estado (o los campos que envíes)
      // (Aquí también podríamos actualizar repuestos, fotos, etc.)
    });

    return NextResponse.json({ message: 'OT actualizada exitosamente' });

  } catch (error) {
    console.error(`Error en PUT /api/ordenes-trabajo/${params.id}:`, error);
    return NextResponse.json({ error: 'Error al actualizar la OT' }, { status: 500 });
  }
}