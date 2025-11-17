// frontend/app/api/vehiculos/por-patente/[patente]/route.ts
// (API NUEVA: Permite buscar un vehículo por su patente)

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

type Context = {
  params: Promise<{ patente: string }>
}

export async function GET(request: NextRequest, context: Context) {
  let patente: string;
  try {
    const params = await context.params;
    patente = params.patente; // Obtiene la patente de la URL

    if (!patente) {
      return NextResponse.json({ error: 'Falta la patente' }, { status: 400 });
    }

    // --- ¡LÓGICA ROBUSTA (Busca con y sin espacios)! ---
    const patenteLimpiaBuscada = patente.toUpperCase().trim();

    const vehiculosSnapshot = await adminDb.collection('vehiculos').get();

    const vehiculoEncontrado = vehiculosSnapshot.docs.find(doc => {
      const patenteDb = doc.data().patente;
      if (!patenteDb) return false;
      
      // Compara ambos limpios
      return patenteDb.toUpperCase().trim() === patenteLimpiaBuscada;
    });
    // --- FIN LÓGICA ROBUSTA ---

    if (!vehiculoEncontrado) {
      return NextResponse.json({ error: 'Vehículo no encontrado con esa patente' }, { status: 404 });
    }
    
    return NextResponse.json({ id: vehiculoEncontrado.id, ...vehiculoEncontrado.data() });

  } catch (error: any) {
    console.error(`Error en GET /api/vehiculos/por-patente/${(context.params as any).patente}:`, error);
    return NextResponse.json({ error: 'Error al obtener el vehículo' }, { status: 500 });
  }
}