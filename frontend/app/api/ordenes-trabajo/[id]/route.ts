// app/api/ordenes-trabajo/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Define el tipo de 'context' que Vercel espera (con la Promise)
type Context = {
  params: Promise<{ id: string }>
}

/**
 * Función GET: Obtiene UNA Orden de Trabajo específica por su ID.
 */
export async function GET(
  request: NextRequest, 
  context: Context // <-- CAMBIO 1: Usa el nuevo tipo 'Context'
) {
  try {
    // CAMBIO 2: ¡Debemos usar 'await' para resolver la Promesa!
    const { id } = await context.params; 
    
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
  request: NextRequest, 
  context: Context // <-- CAMBIO 1: Usa el nuevo tipo 'Context'
) {
  try {
    // CAMBIO 2: ¡Debemos usar 'await' para resolver la Promesa!
    const { id } = await context.params; 
    const body = await request.json(); 

    console.log(`PUT /api/ordenes-trabajo/${id}: Actualizando OT...`);
    console.log('Datos recibidos:', body);

    const otRef = adminDb.collection('ordenes-trabajo').doc(id);
    await otRef.update({ estado: body.estado });

    return NextResponse.json({ message: 'OT actualizada exitosamente' });

  } catch (error) {
    console.error(`Error en PUT /api/ordenes-trabajo/${id}:`, error);
    return NextResponse.json({ error: 'Error al actualizar la OT' }, { status: 500 });
  }
}