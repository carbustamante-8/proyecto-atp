// frontend/app/api/vehiculos/por-conductor/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; // ¡IMPORTACIÓN CORREGIDA!

type Context = {
  params: Promise<{ id: string }> 
}

export async function GET(request: NextRequest, context: Context) {
  let idConductor: string;
  try {
    const params = await context.params;
    idConductor = params.id; 

    if (!idConductor) {
      return NextResponse.json({ error: 'Falta el ID del conductor' }, { status: 400 });
    }
    
    // --- CORRECCIÓN DEFINITIVA! Limpia el ID entrante ---
    // Esto asegura que si el router o el cliente añadieron espacios, se limpien para la búsqueda.
    const cleanedIdConductor = idConductor.trim();
    
    console.log(`GET /api/vehiculos/por-conductor: Buscando vehículo para conductor ID: ${cleanedIdConductor}`);

    const vehiculosRef = adminDb.collection('vehiculos');
    
    // Busca el vehículo usando el ID limpio
    const querySnapshot = await vehiculosRef
      .where('id_chofer_asignado', '==', cleanedIdConductor) 
      .limit(1) 
      .get();

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