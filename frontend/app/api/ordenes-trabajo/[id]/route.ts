// app/api/ordenes-trabajo/[id]/route.ts
// (CÓDIGO ACTUALIZADO: PUT ahora maneja el Cierre Administrativo)

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
 * Función PUT: (¡MODIFICADA!)
 * Maneja 4 casos de estado:
 * 1. Validación del Guardia: 'Agendado' -> 'Pendiente'
 * 2. Auto-Asignación (Mecánico): 'Pendiente' -> 'En Progreso'
 * 3. Gestión Normal (Mecánico): 'En Progreso' -> 'Finalizado'
 * 4. Cierre (Admin): 'Finalizado' -> 'Cerrado'
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
      mecanicoAsignadoNombre?: string | null,
      fechaIngresoTaller?: admin.firestore.FieldValue,
      fechaCierreAdministrativo?: admin.firestore.FieldValue // ¡Nuevo campo de auditoría!
    } = {};

    // --- ¡LÓGICA DE ESTADOS ACTUALIZADA! ---
    
    // CASO 1: El Guardia está "Registrando Llegada"
    if (body.estado === 'Pendiente' && body.accion === 'registrarLlegada') {
      datosActualizados.estado = 'Pendiente'; 
      datosActualizados.fechaIngresoTaller = admin.firestore.FieldValue.serverTimestamp(); 
    }
    
    // CASO 2: El mecánico está "reclamando" la tarea
    else if (body.estado === 'En Progreso' && body.mecanicoAsignadoId && body.mecanicoAsignadoNombre) {
      datosActualizados.mecanicoAsignadoId = body.mecanicoAsignadoId;
      datosActualizados.mecanicoAsignadoNombre = body.mecanicoAsignadoNombre;
      datosActualizados.estado = 'En Progreso';
    } 
    
    // CASO 3: El mecánico está "Finalizando" la tarea
    else if (body.estado === 'Finalizado' && !body.accion) {
      datosActualizados.estado = 'Finalizado';
    }
    
    // --- ¡NUEVO! CASO 4: El Admin está "Cerrando" la OT ---
    else if (body.estado === 'Cerrado' && body.accion === 'cierreAdministrativo') {
      datosActualizados.estado = 'Cerrado';
      datosActualizados.fechaCierreAdministrativo = admin.firestore.FieldValue.serverTimestamp(); // ¡Auditoría!
    }
    
    // CASO 5: El mecánico solo actualiza repuestos (sin cambiar estado)
    else if (body.repuestosUsados !== undefined && !body.estado) {
       // No hacer nada de estados, solo permitir que se guarden los repuestos
    }

    // --- FIN DE LA LÓGICA ---
    
    // Lógica de repuestos y fotos (se aplica en todos los casos)
    if (body.repuestosUsados !== undefined) {
      datosActualizados.repuestosUsados = body.repuestosUsados;
    }
    if (body.nuevaFotoURL) {
      datosActualizados.fotos = admin.firestore.FieldValue.arrayUnion(body.nuevaFotoURL);
    }
    
    // Si no hay nada que actualizar (ej. solo se mandó 'estado: Finalizado' pero ya estaba 'Finalizado')
    if (Object.keys(datosActualizados).length === 0 && !body.repuestosUsados && !body.nuevaFotoURL) {
      // Permitimos que la llamada termine OK sin hacer nada
      return NextResponse.json({ message: 'Sin cambios necesarios.' });
    }

    const otRef = adminDb.collection('ordenes-trabajo').doc(id);
    await otRef.update(datosActualizados);

    return NextResponse.json({ message: 'OT actualizada exitosamente' });

  } catch (error) {
    console.error(`Error en PUT /api/ordenes-trabajo/${id}:`, error); 
    return NextResponse.json({ error: 'Error al actualizar la OT' }, { status: 500 });
  }
}