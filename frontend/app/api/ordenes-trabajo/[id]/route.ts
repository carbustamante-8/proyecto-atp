// frontend/app/api/ordenes-trabajo/[id]/route.ts
// (CÓDIGO ACTUALIZADO: Implementa el Flujo Híbrido de Asignación)

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
 * Función PUT: (¡MODIFICADA PARA FLUJO HÍBRIDO!)
 * Maneja los casos por rol:
 * 1. Guardia: 'Agendado' -> 'Pendiente'
 * 2. Admin (Asignación): 'Pendiente' -> 'Asignada'
 * 3. Mecánico (Gestión): 'Asignada' -> 'En Progreso' -> 'Finalizado'
 * 4. Admin (Cierre): 'Finalizado' -> 'Cerrado'
 * 5. Admin (Anulación): 'Agendado' -> 'Anulado'
 * 6. Guardia (Salida): Añade fecha de salida.
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
      fechaCierreAdministrativo?: admin.firestore.FieldValue,
      fechaAnulacion?: admin.firestore.FieldValue,
      fechaSalidaTaller?: admin.firestore.FieldValue
    } = {};

    // --- ¡NUEVA LÓGICA DE ESTADOS POR ROL! ---
    
    // CASO 1: Guardia "Registra Llegada" (Agendado -> Pendiente)
    if (body.accion === 'registrarLlegada' && body.estado === 'Pendiente') {
      datosActualizados.estado = 'Pendiente'; 
      datosActualizados.fechaIngresoTaller = admin.firestore.FieldValue.serverTimestamp(); 
    }
    
    // CASO 2: Guardia "Registra Salida"
    else if (body.accion === 'registrarSalida') {
      datosActualizados.fechaSalidaTaller = admin.firestore.FieldValue.serverTimestamp();
    }

    // --- ¡NUEVO! CASO 3: Admin "Asigna Tarea" (Pendiente -> Asignada) ---
    else if (body.accion === 'asignarTarea' && body.mecanicoAsignadoId && body.mecanicoAsignadoNombre) {
      datosActualizados.mecanicoAsignadoId = body.mecanicoAsignadoId;
      datosActualizados.mecanicoAsignadoNombre = body.mecanicoAsignadoNombre;
      datosActualizados.estado = 'Asignada'; // ¡Nuevo estado!
    } 
    
    // --- ¡MODIFICADO! CASO 4: Mecánico "Gestiona Tarea" (Asignada -> En Progreso -> Finalizado) ---
    // (El mecánico ya no puede tomar desde 'Pendiente')
    else if (body.estado === 'En Progreso' || body.estado === 'Finalizado') {
      datosActualizados.estado = body.estado;
    }
    
    // CASO 5: Admin "Cierra OT"
    else if (body.accion === 'cierreAdministrativo' && body.estado === 'Cerrado') {
      datosActualizados.estado = 'Cerrado';
      datosActualizados.fechaCierreAdministrativo = admin.firestore.FieldValue.serverTimestamp(); 
    }
    
    // CASO 6: Admin "Anula OT"
    else if (body.accion === 'anularOT' && body.estado === 'Anulado') {
      datosActualizados.estado = 'Anulado';
      datosActualizados.fechaAnulacion = admin.firestore.FieldValue.serverTimestamp(); 
    }
    
    // --- FIN DE LA LÓGICA ---
    
    // Añade repuestos o fotos si vienen en el body (para el mecánico)
    if (body.repuestosUsados !== undefined) {
      datosActualizados.repuestosUsados = body.repuestosUsados;
    }
    if (body.nuevaFotoURL) {
      datosActualizados.fotos = admin.firestore.FieldValue.arrayUnion(body.nuevaFotoURL);
    }
    
    if (Object.keys(datosActualizados).length === 0 && !body.repuestosUsados && !body.nuevaFotoURL) {
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