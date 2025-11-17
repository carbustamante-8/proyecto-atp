// frontend/app/api/vehiculos/route.ts
// (CÓDIGO CORREGIDO: POST ahora limpia la patente y acepta id_chofer_asignado)

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
 * Función POST: (¡ACTUALIZADA! Acepta id_chofer_asignado y lo limpia)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      patente, marca, modelo, año, tipo_vehiculo, estado, id_chofer_asignado, // <-- Acepta el nuevo campo
      color, vin, n_motor, n_chasis, pais_manufactura, tipo_combustible 
    } = body;

    if (!patente) {
      return NextResponse.json({ error: 'La patente es obligatoria' }, { status: 400 });
    }
    
    // 1. Limpieza y validación de Patente (CRÍTICO)
    const patenteLimpia = patente.toUpperCase().trim();
    if (!patenteLimpia) {
      return NextResponse.json({ error: 'La patente no puede estar vacía' }, { status: 400 });
    }
    
    // 2. Validación de patente duplicada (sin cambios)
    const querySnapshot = await adminDb.collection('vehiculos')
      .where('patente', '==', patenteLimpia) 
      .get();
    
    if (!querySnapshot.empty) {
      return NextResponse.json({ error: 'La patente ya está registrada' }, { status: 400 });
    }
    
    // 3. Limpieza del ID del Conductor (CRÍTICO)
    const choferIdLimpio = id_chofer_asignado 
        ? id_chofer_asignado.trim() 
        : null;

    const nuevoVehiculo = {
      patente: patenteLimpia, 
      marca: marca || '',
      modelo: modelo || '',
      año: Number(año) || null,
      tipo_vehiculo: tipo_vehiculo || 'Camión',
      estado: estado || 'Operativo',
      id_chofer_asignado: choferIdLimpio, // <-- Guarda el ID limpio, o null
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