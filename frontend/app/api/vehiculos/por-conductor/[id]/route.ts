// frontend/app/api/vehiculos/por-conductor/[id]/route.ts
// (CÓDIGO CORREGIDO: Renombrado a [id] y lógica de búsqueda arreglada)

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

type Context = {
  params: Promise<{ id: string }> // ¡Ahora sí es 'id'!
}

export async function GET(request: NextRequest, context: Context) {
  let idConductor: string;
  try {
    const params = await context.params;
    idConductor = params.id; // <-- Ahora 'id' es el ID del Conductor

    if (!idConductor) {
      return NextResponse.json({ error: 'Falta el ID del conductor' }, { status: 400 });
    }
    
    console.log(`GET /api/vehiculos/por-conductor: Buscando vehículo para conductor ID: ${idConductor}`);

    const vehiculosRef = adminDb.collection('vehiculos');
    
    // --- ¡LÓGICA CORREGIDA! ---
    const querySnapshot = await vehiculosRef
      .where('id_chofer_asignado', '==', idConductor) // <-- ¡Ahora busca en el campo correcto!
      .limit(1) 
      .get();
    // --- FIN DE LA CORRECCIÓN ---

    if (querySnapshot.empty) {
      console.log(`No se encontró vehículo asignado al conductor: ${idConductor}`);
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }
    
    const vehiculoDoc = querySnapshot.docs[0];
    return NextResponse.json({ id: vehiculoDoc.id, ...vehiculoDoc.data() });

  } catch (error: any) {
    const id = (context.params as any)?.id || 'undefined';
    console.error(`Error en GET /api/vehiculos/por-conductor/${id}:`, error);
    return NextResponse.json({ error: 'Error al obtener el vehículo' }, { status: 500 });
  }
}