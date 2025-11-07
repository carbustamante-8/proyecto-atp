// app/api/ordenes-trabajo/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Define el tipo de 'context' que Vercel espera
type Context = {
  params: Promise<{ id: string }>
}

/**
 * Función GET: Obtiene UNA Orden de Trabajo específica por su ID.
 */
export async function GET(
  request: NextRequest, 
  context: Context
) {
  let id: string;
  try {
    const params = await context.params;
    id = params.id; 
    
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
 * Función PUT: Actualiza 'estado' y 'repuestosUsados' (¡SIN FOTOS!)
 */
export async function PUT(
  request: NextRequest, 
  context: Context
) {
  let id: string = 'ID_DESCONOCIDO'; 
  try {
    const params = await context.params;
    id = params.id; 
    
    const body = await request.json(); 

    // Prepara los datos a actualizar
    const datosActualizados: { estado?: string, repuestosUsados?: string } = {};

    if (body.estado) {
      datosActualizados.estado = body.estado;
    }
    if (body.repuestosUsados !== undefined) {
      datosActualizados.repuestosUsados = body.repuestosUsados;
    }

    // Actualiza el documento en Firestore
    const otRef = adminDb.collection('ordenes-trabajo').doc(id);
    await otRef.update(datosActualizados);

    return NextResponse.json({ message: 'OT actualizada exitosamente' });

  } catch (error) {
    console.error(`Error en PUT /api/ordenes-trabajo/${id}:`, error); 
    return NextResponse.json({ error: 'Error al actualizar la OT' }, { status: 500 });
  }
}