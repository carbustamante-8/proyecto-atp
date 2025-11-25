// frontend/app/api/ordenes-trabajo/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

type Context = {
  params: Promise<{ id: string }>
}

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
    return NextResponse.json({ error: 'Error al obtener la OT' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: Context) {
  let id: string = 'ID_DESCONOCIDO'; 
  try {
    const params = await context.params;
    id = params.id; 
    const body = await request.json(); 

    const datosActualizados: any = {};

    // --- LÓGICA CORREGIDA ---
    
    // CASO 1: Guardia "Registra Llegada"
    if (body.accion === 'registrarLlegada') {
      datosActualizados.estado = 'Pendiente'; 
      datosActualizados.fechaIngresoTaller = admin.firestore.FieldValue.serverTimestamp(); 
    }
    
    // CASO 2: Guardia "Registra Salida"
    else if (body.accion === 'registrarSalida') {
      datosActualizados.fechaSalidaTaller = admin.firestore.FieldValue.serverTimestamp();
    }

    // CASO 3: Admin "Asigna Tarea" (CORREGIDO: Ya no exige 'mecanicoAsignadoNombre')
    else if (body.accion === 'asignarTarea' && body.mecanicoAsignadoId) {
      datosActualizados.mecanicoAsignadoId = body.mecanicoAsignadoId;
      // Si el frontend manda el nombre, lo guardamos. Si no, guardamos solo el ID.
      if (body.mecanicoAsignadoNombre) {
          datosActualizados.mecanicoAsignadoNombre = body.mecanicoAsignadoNombre;
      }
      // Si el frontend manda el estado 'Asignada', lo usamos.
      if (body.estado) {
          datosActualizados.estado = body.estado;
      } else {
          datosActualizados.estado = 'Asignada'; // Forzamos por defecto si no viene
      }
    } 
    
    // CASO 4: Mecánico "Gestiona Tarea"
    else if (body.estado === 'En Progreso' || body.estado === 'Finalizado' || body.estado === 'Asignada') {
      datosActualizados.estado = body.estado;
    }
    
    // CASO 5: Admin "Cierra OT"
    else if (body.accion === 'cierreAdministrativo') {
      datosActualizados.estado = 'Cerrado';
      datosActualizados.fechaCierreAdministrativo = admin.firestore.FieldValue.serverTimestamp(); 
    }
    
    // CASO 6: Anular
    else if (body.accion === 'anularOT') {
      datosActualizados.estado = 'Anulado';
      datosActualizados.fechaAnulacion = admin.firestore.FieldValue.serverTimestamp(); 
    }
    
    // Datos comunes (Repuestos y Fotos)
    if (body.repuestosUsados !== undefined) {
      datosActualizados.repuestosUsados = body.repuestosUsados;
    }
    if (body.nuevaFotoURL) {
      datosActualizados.fotos = admin.firestore.FieldValue.arrayUnion(body.nuevaFotoURL);
    }

    const otRef = adminDb.collection('ordenes-trabajo').doc(id);
    await otRef.update(datosActualizados);

    return NextResponse.json({ message: 'OT actualizada exitosamente' });

  } catch (error) {
    console.error(`Error en PUT /api/ordenes-trabajo/${id}:`, error); 
    return NextResponse.json({ error: 'Error al actualizar la OT' }, { status: 500 });
  }
}