// app/api/vehiculos/route.ts

import { NextResponse, NextRequest } from 'next/server';
// Usamos la ruta relativa larga para asegurar que funcione
import { adminDb } from '../../../lib/firebase-admin'; 

/**
 * Función GET: Obtiene la lista completa de vehículos de la flota.
 */
export async function GET() {
  try {
    console.log('GET /api/vehiculos: Obteniendo lista de vehículos...');

    // 2. Apunta a la colección "vehiculos"
    const vehiculosSnapshot = await adminDb.collection('vehiculos').get();

    // 3. Convierte los datos a un formato JSON simple
    const vehiculos = vehiculosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 4. Responde con la lista de vehículos
    return NextResponse.json(vehiculos);

  } catch (error) {
    console.error("Error en GET /api/vehiculos:", error);
    return NextResponse.json({ error: 'Error al obtener vehículos' }, { status: 500 });
  }
}


/**
 * Función POST: Se ejecuta cuando un formulario
 * cree un nuevo vehículo.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Lee los datos que envió el formulario
    // (Basado en tu SQL y datos del cliente)
    const body = await request.json(); 
    
    console.log('POST /api/vehiculos: Creando nuevo vehículo...');

    // 2. Valida que los datos mínimos llegaron
    if (!body.patente || !body.modelo || !body.tipo_vehiculo) {
      return NextResponse.json({ error: 'Faltan datos (patente, modelo, tipo)' }, { status: 400 });
    }

    // 3. USA LA CONEXIÓN ADMIN para CREAR un nuevo documento
    // ¡Firestore creará la colección "vehiculos" si no existe!
    const nuevoVehiculoRef = await adminDb.collection('vehiculos').add({
      patente: body.patente,
      modelo: body.modelo,
      año: body.año || null,
      tipo_vehiculo: body.tipo_vehiculo, // Ej: "Diésel", "Eléctrico"
      kilometraje: body.kilometraje || 0,
      id_chofer_asignado: body.id_chofer_asignado || null, // ID del usuario chofer
      estado: 'Activo', // Estado del vehículo (Activo, Inactivo, En Taller)
    });

    // 4. Responde con los datos del vehículo creado
    return NextResponse.json({ id: nuevoVehiculoRef.id, ...body, estado: 'Activo' }, { status: 201 });

  } catch (error) {
    console.error("Error en POST /api/vehiculos:", error);
    return NextResponse.json({ error: 'Error al crear el vehículo' }, { status: 500 });
  }
}

  /**
   * Función DELETE: Se ejecuta cuando el frontend pide borrar un vehículo.
   * Recibirá el ID por la URL (ej: /api/vehiculos?id=abc12345)
   */
  export async function DELETE(request: NextRequest) {
    try {
      // 1. Obtiene la URL y saca el ID del vehículo
      const { searchParams } = new URL(request.url);
      const vehiculoId = searchParams.get('id');

      if (!vehiculoId) {
        return NextResponse.json({ error: 'Falta el ID del vehículo' }, { status: 400 });
      }

      console.log(`DELETE /api/vehiculos: Borrando vehículo con ID: ${vehiculoId}`);

      // 2. USA LA LLAVE MAESTRA para borrar el documento de Firestore
      await adminDb.collection('vehiculos').doc(vehiculoId).delete();

      // 3. Responde con un mensaje de éxito
      return NextResponse.json({ message: 'Vehículo eliminado exitosamente' });

    } catch (error) {
      console.error("Error en DELETE /api/vehiculos:", error);
      return NextResponse.json({ error: 'Error al eliminar el vehículo' }, { status: 500 });
    }
  }