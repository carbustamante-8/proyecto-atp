// app/api/ordenes-trabajo/route.ts
// (CÓDIGO ACTUALIZADO: POST ahora guarda 'nombre_conductor')

import { NextResponse, NextRequest } from 'next/server'; 
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin'; 

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

export async function POST(request: Request) {
  try {
    const body = await request.json(); 
    
    if (!body.patente || !body.descripcionProblema) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }
    
    const datosOT = {
      patente: body.patente,
      descripcionProblema: body.descripcionProblema,
      
      // ¡NUEVO CAMPO!
      nombre_conductor: body.nombre_conductor || 'No registrado', 
      
      mecanicoAsignadoId: null, 
      mecanicoAsignadoNombre: null, 
      estado: 'Agendado', 
      
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
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