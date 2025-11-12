// app/api/ordenes-trabajo/[id]/route.ts
// (CÓDIGO ACTUALIZADO: Añadido caso 'registrarSalida')

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

type Context = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Context) {
  let id: string;
  try {
    const params = await context.params;
    id = params.id; 
    const otDoc = await adminDb.collection('ordenes-trabajo').doc(id).get();
    if (!otDoc.exists) return NextResponse.json({ error: 'OT no encontrada' }, { status: 404 });
    return NextResponse.json({ id: otDoc.id, ...otDoc.data() });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener la OT' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: Context) {
  let id: string = 'ID_DESCONOCIDO'; 
  try {
    const params = await context.params;
    id = params.id; 
    const body = await request.json(); 

    const datosActualizados: { 
      estado?: string, 
      repuestosUsados?: string,
      fotos?: admin.firestore.FieldValue,
      mecanicoAsignadoId?: string | null,
      mecanicoAsignadoNombre?: string | null,
      fechaIngresoTaller?: admin.firestore.FieldValue,
      fechaCierreAdministrativo?: admin.firestore.FieldValue,
      fechaAnulacion?: admin.firestore.FieldValue,
      fechaSalidaTaller?: admin.firestore.FieldValue // ¡NUEVO!
    } = {};

    // --- LÓGICA DE ESTADOS ---
    
    // CASO 1: Guardia "Registra Llegada"
    if (body.estado === 'Pendiente' && body.accion === 'registrarLlegada') {
      datosActualizados.estado = 'Pendiente'; 
      datosActualizados.fechaIngresoTaller = admin.firestore.FieldValue.serverTimestamp(); 
    }
    
    // --- ¡NUEVO! CASO 1.5: Guardia "Registra Salida" ---
    else if (body.accion === 'registrarSalida') {
      // No cambiamos el estado (sigue Finalizado o Cerrado), solo la fecha
      datosActualizados.fechaSalidaTaller = admin.firestore.FieldValue.serverTimestamp();
    }

    // CASO 2: Mecánico "Toma Tarea"
    else if (body.estado === 'En Progreso' && body.mecanicoAsignadoId) {
      datosActualizados.mecanicoAsignadoId = body.mecanicoAsignadoId;
      datosActualizados.mecanicoAsignadoNombre = body.mecanicoAsignadoNombre;
      datosActualizados.estado = 'En Progreso';
    } 
    
    // CASO 3: Mecánico "Finaliza"
    else if (body.estado === 'Finalizado' && !body.accion) {
      datosActualizados.estado = 'Finalizado';
    }
    
    // CASO 4: Admin "Cierra OT"
    else if (body.estado === 'Cerrado' && body.accion === 'cierreAdministrativo') {
      datosActualizados.estado = 'Cerrado';
      datosActualizados.fechaCierreAdministrativo = admin.firestore.FieldValue.serverTimestamp(); 
    }
    
    // CASO 5: Admin "Anula OT"
    else if (body.estado === 'Anulado') {
      datosActualizados.estado = 'Anulado';
      datosActualizados.fechaAnulacion = admin.firestore.FieldValue.serverTimestamp(); 
    }
    
    if (body.repuestosUsados !== undefined) datosActualizados.repuestosUsados = body.repuestosUsados;
    if (body.nuevaFotoURL) datosActualizados.fotos = admin.firestore.FieldValue.arrayUnion(body.nuevaFotoURL);
    
    if (Object.keys(datosActualizados).length === 0 && !body.repuestosUsados && !body.nuevaFotoURL) {
      return NextResponse.json({ message: 'Sin cambios.' });
    }

    await adminDb.collection('ordenes-trabajo').doc(id).update(datosActualizados);
    return NextResponse.json({ message: 'OT actualizada exitosamente' });

  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar la OT' }, { status: 500 });
  }
}