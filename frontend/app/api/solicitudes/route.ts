// frontend/app/api/solicitudes/route.ts
// (CÓDIGO ACTUALIZADO: PUT ahora acepta 'id_ot_relacionada' para conectar)

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin'; 
import * as admin from 'firebase-admin';

// (GET, POST, DELETE no cambian... se omiten por brevedad)
// ... (GET, POST, DELETE functions are here) ...

export async function GET(request: NextRequest) {
  try {
    const querySnapshot = await adminDb.collection('solicitudes').get();
    const todasLasSolicitudes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[]; 
    const solicitudesPendientes = todasLasSolicitudes
      .filter(req => req.estado === 'Pendiente') 
      .sort((a, b) => a.fechaCreacion.toMillis() - b.fechaCreacion.toMillis()); 
    return NextResponse.json(solicitudesPendientes);
  } catch (error: any) { 
    console.error("Error en GET /api/solicitudes:", error);
    return NextResponse.json({ error: 'Error al obtener las solicitudes' }, { status: 500 });
  }
}
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
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const solicitudId = searchParams.get('id');
    if (!solicitudId) {
      return NextResponse.json({ error: 'Falta el ID de la solicitud' }, { status: 400 });
    }
    await adminDb.collection('solicitudes').doc(solicitudId).delete();
    return NextResponse.json({ message: 'Solicitud rechazada/eliminada exitosamente' });
  } catch (error) {
    console.error("Error en DELETE /api/solicitudes:", error);
    return NextResponse.json({ error: 'Error al rechazar la solicitud' }, { status: 500 });
  }
}

// --- ¡FUNCIÓN PUT MODIFICADA! ---
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, estado, id_ot_relacionada } = body; // Acepta el nuevo ID

    if (!id || !estado) {
      return NextResponse.json({ error: 'Faltan el ID y el nuevo Estado' }, { status: 400 });
    }

    console.log(`PUT /api/solicitudes: Actualizando solicitud ${id} a estado ${estado}`);

    // Prepara los datos a actualizar
    const datosActualizados: {
      estado: string;
      id_ot_relacionada?: string;
    } = {
      estado: estado,
    };

    // Si se pasó el ID de la OT, lo añade
    if (id_ot_relacionada) {
      datosActualizados.id_ot_relacionada = id_ot_relacionada;
    }

    const solicitudRef = adminDb.collection('solicitudes').doc(id);
    await solicitudRef.update(datosActualizados);

    return NextResponse.json({ message: 'Solicitud actualizada exitosamente' });

  } catch (error) {
    console.error("Error en PUT /api/solicitudes:", error);
    return NextResponse.json({ error: 'Error al actualizar la solicitud' }, { status: 500 });
  }
}