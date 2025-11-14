// frontend/app/api/vehiculos/route.ts
// (CÓDIGO CORREGIDO: Arreglada la función POST con Firebase Admin SDK)

import { NextResponse, NextRequest } from 'next/server';
// ¡CORRECCIÓN IMPORTANTE! Usamos la 'adminDb' del admin-sdk
import { adminDb } from '@/lib/firebase-admin'; 
import * as admin from 'firebase-admin'; // Para el serverTimestamp

/**
 * Función GET: (Sin cambios)
 * Obtiene la lista de todos los vehículos
 */
export async function GET() {
  try {
    const vehiculosSnapshot = await adminDb.collection('vehiculos').get();
    const vehiculos = vehiculosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(vehiculos);
  } catch (error) {
    console.error("Error en GET /api/vehiculos:", error);
    return NextResponse.json({ error: 'Error al obtener vehículos' }, { status: 500 });
  }
}

/**
 * Función POST: (¡CORREGIDA!)
 * Se ejecuta cuando el Admin crea un nuevo vehículo.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patente, marca, modelo, año, tipo_vehiculo, estado, id_chofer_asignado } = body;

    if (!patente) {
      return NextResponse.json({ error: 'La patente es obligatoria' }, { status: 400 });
    }
    
    const patenteMayuscula = patente.toUpperCase();

    // --- ¡SINTAXIS CORREGIDA DE FIREBASE ADMIN! ---
    // 1. Validación de patente duplicada
    const querySnapshot = await adminDb.collection('vehiculos')
      .where('patente', '==', patenteMayuscula)
      .get();
    
    if (!querySnapshot.empty) {
      return NextResponse.json({ error: 'La patente ya está registrada' }, { status: 400 });
    }

    // 2. Creación del vehículo
    const nuevoVehiculo = {
      patente: patenteMayuscula,
      marca,
      modelo,
      año: Number(año), // Aseguramos que sea número
      tipo_vehiculo,
      estado,
      id_chofer_asignado: id_chofer_asignado || null,
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(), // ¡Sintaxis Admin!
    };

    // 3. Guardar en la base de datos
    const docRef = await adminDb.collection('vehiculos').add(nuevoVehiculo);
    // --- FIN DE LA CORRECCIÓN ---
    
    return NextResponse.json({ id: docRef.id, ...nuevoVehiculo }, { status: 201 });

  } catch (error: any) {
    console.error("Error al crear el vehículo:", error);
    return NextResponse.json({ error: 'Error al crear el vehículo', details: error.message }, { status: 500 });
  }
}