// frontend/app/api/solicitudes/route.ts

import { NextResponse, NextRequest } from 'next/server';
// Usamos la ruta relativa larga para asegurar que funcione
import { adminDb } from '../../../lib/firebase-admin'; 
import * as admin from 'firebase-admin';

/**
 * Función POST: Se ejecuta cuando un Conductor
 * crea una nueva solicitud de mantenimiento.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Lee los datos que enviará el formulario del Conductor
    const body = await request.json(); 
    
    // 2. Valida que los datos mínimos llegaron
    // (Estos datos los enviaremos desde el "Cerebro" y el formulario)
    if (!body.id_conductor || !body.nombre_conductor || !body.patente_vehiculo || !body.descripcion_falla) {
      return NextResponse.json({ error: 'Faltan datos (conductor, patente o descripción)' }, { status: 400 });
    }

    console.log('POST /api/solicitudes: Creando nueva solicitud...');
    
    // 3. USA LA CONEXIÓN ADMIN para CREAR un nuevo documento
    // ¡Firestore creará la colección "solicitudes" si no existe!
    const nuevaSolicitudRef = await adminDb.collection('solicitudes').add({
      // Datos del Conductor
      id_conductor: body.id_conductor,
      nombre_conductor: body.nombre_conductor,
      
      // Datos del Vehículo
      patente_vehiculo: body.patente_vehiculo,
      
      // Datos de la Falla
      descripcion_falla: body.descripcion_falla,
      
      // Datos de Estado (para el Coordinador)
      estado: 'Pendiente', // Estado inicial
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      id_ot_relacionada: null, // Aún no tiene OT
    });

    // 4. Responde con los datos de la solicitud creada
    return NextResponse.json({ id: nuevaSolicitudRef.id, ...body, estado: 'Pendiente' }, { status: 201 });

  } catch (error) {
    console.error("Error en POST /api/solicitudes:", error);
    return NextResponse.json({ error: 'Error al crear la solicitud' }, { status: 500 });
  }
}