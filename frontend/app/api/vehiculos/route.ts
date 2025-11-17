// frontend/app/api/vehiculos/route.ts
// (CÓDIGO CORREGIDO: POST ahora limpia la patente antes de guardarla)

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * Función GET: (Sin cambios)
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
 * Función POST: (¡ACTUALIZADA!)
 * Limpia (trim) y pone en mayúsculas la patente antes de guardarla.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      patente, marca, modelo, año, tipo_vehiculo, estado, id_chofer_asignado,
      color, vin, n_motor, n_chasis, pais_manufactura, tipo_combustible 
    } = body;

    if (!patente) {
      return NextResponse.json({ error: 'La patente es obligatoria' }, { status: 400 });
    }
    
    // --- ¡CORRECCIÓN! Limpia la patente ---
    const patenteLimpia = patente.toUpperCase().trim();
    if (!patenteLimpia) {
      return NextResponse.json({ error: 'La patente no puede estar vacía' }, { status: 400 });
    }
    // --- FIN CORRECCIÓN ---

    // Validación de patente duplicada
    const querySnapshot = await adminDb.collection('vehiculos')
      .where('patente', '==', patenteLimpia) // Busca la patente limpia
      .get();
    
    if (!querySnapshot.empty) {
      return NextResponse.json({ error: 'La patente ya está registrada' }, { status: 400 });
    }

    const nuevoVehiculo = {
      patente: patenteLimpia, // <-- Guarda la patente limpia
      marca: marca || '',
      modelo: modelo || '',
      año: Number(año) || null,
      tipo_vehiculo: tipo_vehiculo || 'Camión',
      estado: estado || 'Operativo',
      id_chofer_asignado: id_chofer_asignado || null,
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      color: color || '',
      vin: vin || '',
      n_motor: n_motor || '',
      n_chasis: n_chasis || '',
      pais_manufactura: pais_manufactura || '',
      tipo_combustible: tipo_combustible || '',
    };

    const docRef = await adminDb.collection('vehiculos').add(nuevoVehiculo);
    
    return NextResponse.json({ id: docRef.id, ...nuevoVehiculo }, { status: 201 });

  } catch (error: any) {
    console.error("Error al crear el vehículo:", error);
    return NextResponse.json({ error: 'Error al crear el vehículo', details: error.message }, { status: 500 });
  }
}