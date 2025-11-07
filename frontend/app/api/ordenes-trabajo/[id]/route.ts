// app/api/ordenes-trabajo/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
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

    // --- ¡AQUÍ ESTÁ LA LÓGICA COMPLETA! ---
    // Prepara los datos a actualizar
    const datosActualizados: { 
      estado?: string, 
      repuestosUsados?: string,
      fotos?: admin.firestore.FieldValue // Para el array de fotos
    } = {};

    // Si el body envió un 'estado', lo añade
    if (body.estado) {
      datosActualizados.estado = body.estado;
    }
    
    // Si el body envió 'repuestosUsados', lo añade
    if (body.repuestosUsados !== undefined) {
      datosActualizados.repuestosUsados = body.repuestosUsados;
    }
    
    // Si el body envió una 'nuevaFotoURL' (de Vercel Blob), la AÑADE a un array
    if (body.nuevaFotoURL) {
      // 'arrayUnion' añade un ítem a un array sin duplicarlo
      // Esto crea el campo 'fotos' si no existe
      datosActualizados.fotos = admin.firestore.FieldValue.arrayUnion(body.nuevaFotoURL);
    }
    // --- FIN DE LA LÓGICA ---
    
    // Revisa si el objeto de actualización está vacío
    if (Object.keys(datosActualizados).length === 0) {
      throw new Error('No se enviaron datos para actualizar.');
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