// app/api/ordenes-trabajo/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server'; // <-- CAMBIO 1: Importar NextRequest
import { adminDb } from '@/lib/firebase-admin';

/**
 * Función GET: Obtiene UNA Orden de Trabajo específica por su ID.
 */
export async function GET(
  request: NextRequest, // <-- CAMBIO 2: Usar NextRequest
  context: { params: { id: string } } // <-- CAMBIO 3: Usar 'context'
) {
  try {
    const id = context.params.id; // <-- CAMBIO 4: Leer el 'id' desde 'context'
    
    const otDoc = await adminDb.collection('ordenes-trabajo').doc(id).get();

    if (!otDoc.exists) {
      return NextResponse.json({ error: 'OT no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ id: otDoc.id, ...otDoc.data() });

  } catch (error) {
    console.error(`Error en GET /api/ordenes-trabajo/[id]:`, error);
    return NextResponse.json({ error: 'Error al obtener la OT' }, { status: 500 });
  }
}


/**
 * Función PUT: Actualiza UNA Orden de Trabajo específica.
 */
export async function PUT(
  request: NextRequest, // <-- CAMBIO 2: Usar NextRequest
  context: { params: { id: string } } // <-- CAMBIO 3: Usar 'context'
) {
  const id = context.params.id; // Mover la lectura del 'id' fuera del try para que esté disponible en el catch
  try {
    const body = await request.json(); // Obtiene los datos a actualizar (ej: { estado: "En Progreso" })

    console.log(`PUT /api/ordenes-trabajo/${id}: Actualizando OT...`);
    console.log('Datos recibidos:', body);

    const otRef = adminDb.collection('ordenes-trabajo').doc(id);

    // Actualiza el documento en Firestore
    await otRef.update({
      estado: body.estado, 
      // (Aquí también podríamos actualizar repuestos, fotos, etc.)
    });

    return NextResponse.json({ message: 'OT actualizada exitosamente' });

  } catch (error) {
    console.error(`Error en PUT /api/ordenes-trabajo/${id}:`, error);
    return NextResponse.json({ error: 'Error al actualizar la OT' }, { status: 500 });
  }
}