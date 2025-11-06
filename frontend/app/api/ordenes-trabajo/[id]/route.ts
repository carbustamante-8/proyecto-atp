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
  context: Context
) {
  // --- ARREGLO PARA EL LOG DE ERRORES ---
  let id: string;
  // --- FIN ARREGLO ---

  try {
    const params = await context.params;
    id = params.id; // Asigna el valor
    
    const otDoc = await adminDb.collection('ordenes-trabajo').doc(id).get();

    if (!otDoc.exists) {
      return NextResponse.json({ error: 'OT no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ id: otDoc.id, ...otDoc.data() });

  } catch (error) {
    console.error(`Error en GET /api/ordenes-trabajo/[id]:`, error); // El 'id' no está aquí, pero el error general es suficiente
    return NextResponse.json({ error: 'Error al obtener la OT' }, { status: 500 });
  }
}


/**
 * Función PUT: Actualiza UNA Orden de Trabajo específica.
 */
export async function PUT(
  request: NextRequest, 
  context: Context
) {
  // --- ARREGLO PARA EL LOG DE ERRORES ---
  let id: string = 'ID_DESCONOCIDO'; // Pon un valor por defecto
  // --- FIN ARREGLO ---

  try {
    const params = await context.params;
    id = params.id; // Asigna el valor real
    
    const body = await request.json(); 

    console.log(`PUT /api/ordenes-trabajo/${id}: Actualizando OT...`);
    console.log('Datos recibidos:', body);

    const otRef = adminDb.collection('ordenes-trabajo').doc(id);
      // Prepara los datos a actualizar
      const datosActualizados: { estado: string, repuestosUsados?: string } = {
        estado: body.estado,
      };

      // Solo añade 'repuestosUsados' si fue enviado
      if (body.repuestosUsados !== undefined) {
        datosActualizados.repuestosUsados = body.repuestosUsados;
      }

      // Actualiza el documento en Firestore
      await otRef.update(datosActualizados);

    return NextResponse.json({ message: 'OT actualizada exitosamente' });

  } catch (error) {
    // Ahora 'id' SÍ es accesible aquí para el log
    console.error(`Error en PUT /api/ordenes-trabajo/${id}:`, error); 
    return NextResponse.json({ error: 'Error al actualizar la OT' }, { status: 500 });
  }
}