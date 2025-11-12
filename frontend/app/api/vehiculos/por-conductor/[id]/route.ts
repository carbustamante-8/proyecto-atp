// frontend/app/api/vehiculos/por-conductor/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
// (Usamos la ruta relativa larga para asegurar que funcione)
import { adminDb } from '../../../../../lib/firebase-admin'; 

// Define el tipo de 'context' que Vercel espera
type Context = {
  params: Promise<{ id: string }> // El 'id' aquí es el ID del CONDUCTOR
}

/**
 * Función GET: Obtiene UN vehículo específico buscando
 * por el ID del conductor asignado.
 */
export async function GET(
  request: NextRequest, 
  context: Context
) {
  let idConductor: string;
  try {
    const params = await context.params;
    idConductor = params.id; 
    
    console.log(`GET /api/vehiculos/por-conductor: Buscando vehículo para conductor ID: ${idConductor}`);

    // 2. Busca en Firestore el vehículo que tenga este ID de conductor
    const querySnapshot = await adminDb.collection('vehiculos')
      .where('id_chofer_asignado', '==', idConductor)
      .limit(1) // Un conductor solo debe tener un vehículo asignado
      .get();

    if (querySnapshot.empty) {
      // Si no encontramos nada...
      console.warn(`No se encontró vehículo asignado al conductor: ${idConductor}`);
      return NextResponse.json({ error: 'No tienes un vehículo asignado.' }, { status: 404 });
    }

    // 3. ¡Encontramos el vehículo!
    const vehiculoDoc = querySnapshot.docs[0];
    
    // Responde con los datos del vehículo
    return NextResponse.json({ id: vehiculoDoc.id, ...vehiculoDoc.data() });

  } catch (error) {
    console.error(`Error en GET /api/vehiculos/por-conductor/[id]:`, error); 
    return NextResponse.json({ error: 'Error al obtener el vehículo' }, { status: 500 });
  }
}