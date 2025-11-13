// app/api/ordenes-trabajo/route.ts
// (CÓDIGO ACTUALIZADO: POST ahora acepta 'fechaHoraAgendada' y datos del conductor)

import { NextResponse, NextRequest } from 'next/server'; 
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin'; 

// (La función GET no cambia)
export async function GET(request: NextRequest) { 
  try {
    const { searchParams } = new URL(request.url);
    const mecanicoId = searchParams.get('mecanicoId');
    let query = adminDb.collection('ordenes-trabajo');
    
    if (mecanicoId) {
      const otSnapshot = await query.where('mecanicoAsignadoId', '==', mecanicoId).get();
      const ordenes = otSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json(ordenes);
    } else {
      const otSnapshot = await query.get();
      const ordenes = otSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json(ordenes);
    }
  } catch (error) {
    console.error("Error en GET /api/ordenes-trabajo:", error);
    return NextResponse.json({ error: 'Error al obtener OTs' }, { status: 500 });
  }
}

/**
 * Función POST: (¡MODIFICADA!)
 * El estado inicial es 'Agendado' y guarda la fecha de la cita.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json(); 
    console.log('POST /api/ordenes-trabajo: Agendando nueva OT...');
    
    // --- ¡NUEVA VALIDACIÓN! ---
    if (!body.patente || !body.descripcionProblema || !body.fechaHoraAgendada) {
      return NextResponse.json({ error: 'Faltan datos (Patente, Descripción y Fecha son obligatorios)' }, { status: 400 });
    }
    
    // --- ¡NUEVOS DATOS! ---
    const datosOT = {
      patente: body.patente,
      descripcionProblema: body.descripcionProblema,
      
      // Datos del conductor (vienen de la solicitud original)
      id_conductor: body.id_conductor || null, 
      nombre_conductor: body.nombre_conductor || 'Ingreso Físico', 
      
      // La fecha/hora de la cita
      fechaHoraAgendada: admin.firestore.Timestamp.fromDate(new Date(body.fechaHoraAgendada)),
      
      mecanicoAsignadoId: null, 
      mecanicoAsignadoNombre: null, 
      estado: 'Agendado', 
      
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(), // Fecha en que se creó el registro
      fotos: [], 
      repuestosUsados: "" 
    };
    
    const nuevaOtRef = await adminDb.collection('ordenes-trabajo').add(datosOT);

    return NextResponse.json({ id: nuevaOtRef.id, ...datosOT }, { status: 201 });

  } catch (error) {
    console.error("Error en POST /api/ordenes-trabajo:", error);
    return NextResponse.json({ error: 'Error al crear la OT' }, { status: 500 });
  }
}