// app/api/ordenes-trabajo/[id]/route.ts
// (CÓDIGO ACTUALIZADO: PUT ahora maneja el flujo de APROBACIÓN)

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
 * Función PUT: (¡MODIFICADA PARA CU-06!)
 * Maneja 3 casos:
 * 1. Asignación (Jefe de Taller): Pasa a 'Pendiente Aprobación'.
 * 2. Aprobación (Supervisor): Pasa a 'Pendiente'.
 * 3. Gestión (Mecánico): Cambia estado, repuestos, fotos.
 */
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
      mecanicoAsignadoNombre?: string | null
    } = {};

    // --- ¡LÓGICA DE ESTADOS ACTUALIZADA! ---

    // CASO 1: El Jefe de Taller está ASIGNANDO (CU-05)
    if (body.mecanicoAsignadoId && body.mecanicoAsignadoNombre) {
      datosActualizados.mecanicoAsignadoId = body.mecanicoAsignadoId;
      datosActualizados.mecanicoAsignadoNombre = body.mecanicoAsignadoNombre;
      // ¡Pasa a Aprobación!
      datosActualizados.estado = 'Pendiente Aprobación'; 
    }
    
    // CASO 2: El Supervisor está APROBANDO (CU-06)
    else if (body.accion === 'aprobar') {
      // El Supervisor aprueba, pasa a "Pendiente" (visible para el mecánico)
      datosActualizados.estado = 'Pendiente';
    }
    
    // CASO 3: El Supervisor está RECHAZANDO (CU-06 Alterno)
    else if (body.accion === 'rechazar') {
      // El Supervisor rechaza, vuelve a "Pendiente Diagnóstico" y limpia la asignación
      datosActualizados.estado = 'Pendiente Diagnóstico';
      datosActualizados.mecanicoAsignadoId = null;
      datosActualizados.mecanicoAsignadoNombre = null;
    }
    
    // CASO 4: El Mecánico está GESTIONANDO (CU-08)
    else {
      if (body.estado) {
        datosActualizados.estado = body.estado; // (En Progreso, Finalizado)
      }
      if (body.repuestosUsados !== undefined) {
        datosActualizados.repuestosUsados = body.repuestosUsados;
      }
      if (body.nuevaFotoURL) {
        datosActualizados.fotos = admin.firestore.FieldValue.arrayUnion(body.nuevaFotoURL);
      }
    }
    // --- FIN DE LA LÓGICA DE ESTADOS ---
    
    if (Object.keys(datosActualizados).length === 0) {
      throw new Error('No se enviaron datos para actualizar.');
    }

    const otRef = adminDb.collection('ordenes-trabajo').doc(id);
    await otRef.update(datosActualizados);

    return NextResponse.json({ message: 'OT actualizada exitosamente' });

  } catch (error) {
    console.error(`Error en PUT /api/ordenes-trabajo/${id}:`, error); 
    return NextResponse.json({ error: 'Error al actualizar la OT' }, { status: 500 });
  }
}