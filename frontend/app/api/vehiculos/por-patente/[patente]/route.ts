// frontend/app/api/vehiculos/por-patente/[patente]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

type Context = {
  params: Promise<{ patente: string }>
}

export async function GET(request: NextRequest, context: Context) {
  let patente: string;
  try {
    const params = await context.params;
    patente = params.patente; 

    if (!patente) {
      return NextResponse.json({ error: 'Falta la patente' }, { status: 400 });
    }

    const patenteLimpiaBuscada = patente.toUpperCase().trim();
    
    // --- LÓGICA CORREGIDA: Usa una consulta 'where' eficiente ---
    const querySnapshot = await adminDb.collection('vehiculos')
      .where('patente', '==', patenteLimpiaBuscada) // <-- Búsqueda directa
      .limit(1)
      .get();
    // --- FIN LÓGICA CORREGIDA ---

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Vehículo no encontrado con esa patente' }, { status: 404 });
    }
    
    const vehiculoEncontrado = querySnapshot.docs[0];
    return NextResponse.json({ id: vehiculoEncontrado.id, ...vehiculoEncontrado.data() });

  } catch (error: any) {
    console.error(`Error en GET /api/vehiculos/por-patente/${(context.params as any).patente}:`, error);
    return NextResponse.json({ error: 'Error al obtener el vehículo' }, { status: 500 });
  }
}