// frontend/app/api/solicitudes/route.ts
// (CÓDIGO ACTUALIZADO: Añadida la función DELETE)

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin'; 
import * as admin from 'firebase-admin';

// (Tipo de dato para la API)
type SolicitudDoc = {
  id: string;
  estado: string;
  fechaCreacion: admin.firestore.Timestamp;
}

/**
 * Función GET: (Sin cambios)
 * Obtiene la lista de solicitudes PENDIENTES
 */
export async function GET(request: NextRequest) {
  try {
    const querySnapshot = await adminDb.collection('solicitudes').get();

    const todasLasSolicitudes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as SolicitudDoc[]; 

    const solicitudesPendientes = todasLasSolicitudes
      .filter(req => req.estado === 'Pendiente') 
      .sort((a, b) => a.fechaCreacion.toMillis() - b.fechaCreacion.toMillis()); 

    return NextResponse.json(solicitudesPendientes);
  } catch (error: any) { 
    console.error("Error en GET /api/solicitudes:", error);
    if (error.code === 'FAILED_PRECONDITION') {
        return NextResponse.json({ error: 'Error de BD: Se requiere un índice.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Error al obtener las solicitudes' }, { status: 500 });
  }
}

/**
 * Función POST: (Sin cambios)
 * Se ejecuta cuando un Conductor crea una nueva solicitud.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    if (!body.id_conductor || !body.nombre_conductor || !body.patente_vehiculo || !body.descripcion_falla) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }
    const nuevaSolicitudRef = await adminDb.collection('solicitudes').add({
      id_conductor: body.id_conductor,
      nombre_conductor: body.nombre_conductor,
      patente_vehiculo: body.patente_vehiculo,
      descripcion_falla: body.descripcion_falla,
      estado: 'Pendiente', 
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      id_ot_relacionada: null, 
    });
    return NextResponse.json({ id: nuevaSolicitudRef.id, ...body, estado: 'Pendiente' }, { status: 201 });
  } catch (error: any) { 
    console.error("Error en POST /api/solicitudes:", error);
    return NextResponse.json({ error: 'Error al crear la solicitud' }, { status: 500 });
  }
}


// --- ¡FUNCIÓN NUEVA! ---
/**
 * Función DELETE: Se ejecuta cuando un Coordinador
 * RECHAZA (borra) una solicitud.
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Lee el ID de la solicitud que queremos borrar
    const { searchParams } = new URL(request.url);
    const solicitudId = searchParams.get('id');

    if (!solicitudId) {
      return NextResponse.json({ error: 'Falta el ID de la solicitud' }, { status: 400 });
    }

    console.log(`DELETE /api/solicitudes: Borrando solicitud ID: ${solicitudId}`);

    // 2. Borra el documento de Firestore
    await adminDb.collection('solicitudes').doc(solicitudId).delete();

    // 3. Responde con un mensaje de éxito
    return NextResponse.json({ message: 'Solicitud rechazada/eliminada exitosamente' });

  } catch (error) {
    console.error("Error en DELETE /api/solicitudes:", error);
    return NextResponse.json({ error: 'Error al rechazar la solicitud' }, { status: 500 });
  }
}