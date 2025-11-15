// frontend/app/api/vehiculos/por-conductor/[id]/route.ts
// (CÓDIGO CORREGIDO: La consulta 'where' ahora es correcta)

import { NextResponse, NextRequest } from 'next/server';
// ¡CORRECCIÓN IMPORTANTE! Usamos la 'adminDb' del admin-sdk
import { adminDb } from '../../../../../lib/firebase-admin';

type Context = {
  params: Promise<{ id: string }> // El 'id' aquí es el ID del CONDUCTOR
}

/**
 * Función GET: (¡CORREGIDA!)
 * Busca en la colección 'vehiculos' usando un 'where'
 * para encontrar el vehículo asignado al 'id_chofer_asignado'.
 */
export async function GET(request: NextRequest, context: Context) {
  let idConductor: string;
  try {
    const params = await context.params;
    idConductor = params.id; 

    if (!idConductor) {
      return NextResponse.json({ error: 'Falta el ID del conductor' }, { status: 400 });
    }
    
    console.log(`GET /api/vehiculos/por-conductor: Buscando vehículo para conductor ID: ${idConductor}`);

    // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
    // 1. Apunta a la colección 'vehiculos'
    const vehiculosRef = adminDb.collection('vehiculos');
    
    // 2. Busca el vehículo donde el 'id_chofer_asignado' coincida
    const querySnapshot = await vehiculosRef
      .where('id_chofer_asignado', '==', idConductor)
      .limit(1) // Un conductor solo debe tener un vehículo
      .get();
    // --- FIN DE LA CORRECCIÓN ---

    // 3. Comprueba si se encontró un resultado
    if (querySnapshot.empty) {
      // Esto es normal, el conductor puede no tener vehículo
      console.log(`No se encontró vehículo asignado al conductor: ${idConductor}`);
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }
    
    // 4. Devuelve el vehículo encontrado
    const vehiculoDoc = querySnapshot.docs[0];
    return NextResponse.json({ id: vehiculoDoc.id, ...vehiculoDoc.data() });

  } catch (error: any) {
    console.error(`Error en GET /api/vehiculos/por-conductor/${(context.params as any).id}:`, error);
    return NextResponse.json({ error: 'Error al obtener el vehículo' }, { status: 500 });
  }
}