// app/api/vehiculos/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
// Usamos la ruta relativa larga para asegurar que funcione
import { adminDb } from '../../../../lib/firebase-admin'; 

// Define el tipo de 'context' que Vercel espera
type Context = {
  params: Promise<{ id: string }>
}

/**
 * Función GET: Obtiene UN vehículo específico por su ID.
 * (La página "Editar Vehículo" llamará a esto para rellenar el formulario)
 */
export async function GET(
  request: NextRequest, 
  context: Context
) {
  let id: string;
  try {
    const params = await context.params;
    id = params.id; 
    
    // Busca el documento en Firestore
    const vehiculoDoc = await adminDb.collection('vehiculos').doc(id).get();

    if (!vehiculoDoc.exists) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    // Responde con los datos del vehículo
    return NextResponse.json({ id: vehiculoDoc.id, ...vehiculoDoc.data() });

  } catch (error) {
    console.error(`Error en GET /api/vehiculos/[id]:`, error); 
    return NextResponse.json({ error: 'Error al obtener el vehículo' }, { status: 500 });
  }
}


/**
 * Función PUT: Actualiza UN vehículo específico.
 * (El formulario "Editar Vehículo" llamará a esto al guardar)
 */
export async function PUT(
  request: NextRequest, 
  context: Context
) {
  let id: string = 'ID_DESCONOCIDO'; 
  try {
    const params = await context.params;
    id = params.id; 
    
    // Lee los datos que envió el formulario de edición
    const body = await request.json(); 

    // Prepara los datos a actualizar (solo los campos permitidos)
    const datosParaActualizar: { 
      patente?: string, 
      modelo?: string,
      año?: number,
      tipo_vehiculo?: string,
      kilometraje?: number,
      id_chofer_asignado?: string | null,
      estado?: string
    } = {};

    // Asigna solo los campos que vinieron en el body
    if (body.patente) datosParaActualizar.patente = body.patente;
    if (body.modelo) datosParaActualizar.modelo = body.modelo;
    if (body.año) datosParaActualizar.año = body.año;
    if (body.tipo_vehiculo) datosParaActualizar.tipo_vehiculo = body.tipo_vehiculo;
    if (body.kilometraje !== undefined) datosParaActualizar.kilometraje = body.kilometraje;
    if (body.id_chofer_asignado !== undefined) datosParaActualizar.id_chofer_asignado = body.id_chofer_asignado;
    if (body.estado) datosParaActualizar.estado = body.estado;


    if (Object.keys(datosParaActualizar).length === 0) {
      return NextResponse.json({ error: 'No se enviaron datos para actualizar' }, { status: 400 });
    }

    // Actualiza el documento en Firestore
    const vehiculoRef = adminDb.collection('vehiculos').doc(id);
    await vehiculoRef.update(datosParaActualizar);

    return NextResponse.json({ message: 'Vehículo actualizado exitosamente' });

  } catch (error) {
    console.error(`Error en PUT /api/vehiculos/${id}:`, error); 
    return NextResponse.json({ error: 'Error al actualizar el vehículo' }, { status: 500 });
  }
}