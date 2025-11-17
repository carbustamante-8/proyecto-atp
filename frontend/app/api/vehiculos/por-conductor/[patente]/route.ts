// frontend/app/api/vehiculos/por-patente/[patente]/route.ts
// (CÓDIGO CORREGIDO: La búsqueda ahora quita espacios y es case-insensitive)

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

    // --- ¡CORRECCIÓN ROBUSTA! ---
    // 1. Limpia la patente de la URL (quita espacios y a mayúsculas)
    const patenteLimpiaBuscada = patente.toUpperCase().trim();

    // 2. Trae todos los vehículos (no podemos hacer .trim() en un 'where')
    const vehiculosSnapshot = await adminDb.collection('vehiculos').get();

    // 3. Filtra manualmente en el servidor
    const vehiculoEncontrado = vehiculosSnapshot.docs.find(doc => {
      const patenteDb = doc.data().patente;
      if (!patenteDb) return false;
      
      // Compara ambos limpios, en mayúsculas y sin espacios
      return patenteDb.toUpperCase().trim() === patenteLimpiaBuscada;
    });
    // --- FIN DE LA CORRECCIÓN ---

    if (!vehiculoEncontrado) {
      return NextResponse.json({ error: 'Vehículo no encontrado con esa patente' }, { status: 404 });
    }
    
    // Devuelve el vehículo encontrado
    return NextResponse.json({ id: vehiculoEncontrado.id, ...vehiculoEncontrado.data() });

  } catch (error: any) {
    console.error(`Error en GET /api/vehiculos/por-patente/${(context.params as any).patente}:`, error);
    return NextResponse.json({ error: 'Error al obtener el vehículo' }, { status: 500 });
  }
}