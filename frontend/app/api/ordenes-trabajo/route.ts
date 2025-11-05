// app/api/ordenes-trabajo/route.ts

import { NextResponse } from 'next/server';
// 1. IMPORTA LA LLAVE MAESTRA
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin'; // Necesitamos 'admin' para la fecha

/**
 * Función GET: Se ejecuta cuando el "Tablero del Mecánico"
 * pida la lista de OTs.
 */
export async function GET() {
  try {
    console.log('GET /api/ordenes-trabajo: Obteniendo lista de OTs...');

    // 2. Apunta a la colección "ordenes-trabajo"
    const otSnapshot = await adminDb.collection('ordenes-trabajo').get();

    // 3. Convierte los datos a un formato JSON simple
    const ordenes = otSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 4. Responde con la lista de OTs
    return NextResponse.json(ordenes);

  } catch (error) {
    console.error("Error en GET /api/ordenes-trabajo:", error);
    return NextResponse.json({ error: 'Error al obtener OTs' }, { status: 500 });
  }
}


/**
 * Función POST: Se ejecuta cuando un formulario (ej: del Guardia o Jefe de Taller)
 * cree una nueva OT.
 */
export async function POST(request: Request) {
  try {
    // 1. Lee los datos que envió el formulario
    // (Datos de ejemplo basados en tus maquetas)
    const body = await request.json(); 
    
    console.log('POST /api/ordenes-trabajo: Creando nueva OT...');
    
    // 2. USA LA CONEXIÓN ADMIN para CREAR un nuevo documento en Firestore
    // ¡Firestore creará la colección "ordenes-trabajo" si no existe!
    const nuevaOtRef = await adminDb.collection('ordenes-trabajo').add({
      patente: body.patente,
      descripcionProblema: body.descripcionProblema,
      mecanicoAsignado: body.mecanicoAsignado || null, // (ID del mecánico)
      // Estado inicial (basado en tu maqueta)
      estado: 'Pendiente', 
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(), // Pone la fecha actual
      // (Aquí irán más campos después, como repuestos, fotos, etc.)
    });

    // 3. Responde con los datos de la OT creada
    return NextResponse.json({ id: nuevaOtRef.id, ...body, estado: 'Pendiente' }, { status: 201 });

  } catch (error) {
    console.error("Error en POST /api/ordenes-trabajo:", error);
    return NextResponse.json({ error: 'Error al crear la OT' }, { status: 500 });
  }
}