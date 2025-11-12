// app/api/ordenes-trabajo/route.ts
// (CÓDIGO ACTUALIZADO: POST ahora solo crea la OT en estado "Pendiente Diagnóstico")

import { NextResponse, NextRequest } from 'next/server'; 
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin'; 

/**
 * Función GET: (Sin cambios)
 * Se usa para el tablero del mecánico (filtrado)
 */
export async function GET(request: NextRequest) { 
  try {
    const { searchParams } = new URL(request.url);
    const mecanicoId = searchParams.get('mecanicoId');
    let query = adminDb.collection('ordenes-trabajo');
    
    if (mecanicoId) {
      console.log(`GET /api/ordenes-trabajo: Filtrando para mecanicoId: ${mecanicoId}`);
      const otSnapshot = await query.where('mecanicoAsignadoId', '==', mecanicoId).get();
      const ordenes = otSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json(ordenes);
    } else {
      console.log('GET /api/ordenes-trabajo: Obteniendo TODAS las OTs...');
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
 * Ahora solo registra la OT, sin asignar mecánico.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json(); 
    console.log('POST /api/ordenes-trabajo: Creando nueva OT...');
    
    // --- ¡MODIFICACIÓN! ---
    // Ya no pedimos los datos del mecánico, solo lo básico.
    if (!body.patente || !body.descripcionProblema) {
      return NextResponse.json({ error: 'Faltan datos (Patente y Descripción)' }, { status: 400 });
    }
    
    const datosOT = {
      patente: body.patente,
      descripcionProblema: body.descripcionProblema,
      
      // Valores por defecto para el nuevo flujo de diagnóstico
      mecanicoAsignadoId: null, 
      mecanicoAsignadoNombre: null, 
      estado: 'Pendiente Diagnóstico', // <-- ¡NUEVO ESTADO INICIAL!
      
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      fotos: [], 
      repuestosUsados: "" 
    };
    
    const nuevaOtRef = await adminDb.collection('ordenes-trabajo').add(datosOT);
    // --- FIN DE LA MODIFICACIÓN ---

    return NextResponse.json({ id: nuevaOtRef.id, ...datosOT }, { status: 201 });

  } catch (error) {
    console.error("Error en POST /api/ordenes-trabajo:", error);
    return NextResponse.json({ error: 'Error al crear la OT' }, { status: 500 });
  }
}