// frontend/app/api/solicitudes/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import * as admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const querySnapshot = await adminDb.collection('solicitudes').get();
    const todasLasSolicitudes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(), 
    })) as any[]; 
    
    // CORRECCIÓN: Devolvemos TODAS las solicitudes (ordenadas por fecha), 
    // no solo las pendientes. El frontend se encargará de separar las listas.
    const ordenadas = todasLasSolicitudes.sort((a, b) => 
      b.fechaCreacion.toMillis() - a.fechaCreacion.toMillis()
    );
    
    return NextResponse.json(ordenadas);
  } catch (error: any) { 
    console.error("Error GET /api/solicitudes:", error);
    return NextResponse.json({ error: 'Error al obtener solicitudes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const { id_conductor, nombre_conductor, patente_vehiculo, descripcion_falla, fotoEvidenciaUrl } = body;

    if (!id_conductor || !nombre_conductor || !patente_vehiculo || !descripcion_falla) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const nuevaSolicitudRef = await adminDb.collection('solicitudes').add({
      id_conductor,
      nombre_conductor,
      patente_vehiculo,
      descripcion_falla,
      fotoEvidenciaUrl: fotoEvidenciaUrl || null,
      estado: 'Pendiente', 
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      id_ot_relacionada: null, 
    });
    
    return NextResponse.json({ id: nuevaSolicitudRef.id, ...body, estado: 'Pendiente' }, { status: 201 });
  } catch (error: any) { 
    return NextResponse.json({ error: 'Error crear solicitud' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, estado, id_ot_relacionada } = body; 
    if (!id || !estado) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });

    const datosActualizados: any = { estado };
    if (id_ot_relacionada) datosActualizados.id_ot_relacionada = id_ot_relacionada;

    await adminDb.collection('solicitudes').doc(id).update(datosActualizados);
    return NextResponse.json({ message: 'Actualizado' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error update' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });
    
    await adminDb.collection('solicitudes').doc(id).delete();
    return NextResponse.json({ message: 'Eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error delete' }, { status: 500 });
  }
}