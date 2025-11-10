// app/api/reportes/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin'; 
import * as admin from 'firebase-admin';

// --- ¡ARREGLO 1! ---
// Definimos el "tipo" de OT (ahora TypeScript sabrá qué es 'patente')
type OrdenDeTrabajo = {
  id: string;
  estado: string;
  patente: string;
  fechaCreacion: admin.firestore.Timestamp; // Objeto de fecha de Firebase
  // (y todos los otros campos: descripcionProblema, etc.)
}

/**
 * Función GET: Obtiene una lista FILTRADA de Órdenes de Trabajo.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/reportes: Iniciando generación de reporte...');

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado'); 
    const patente = searchParams.get('patente'); 
    const fechaInicio = searchParams.get('fechaInicio'); 
    const fechaFin = searchParams.get('fechaFin'); 

    const otSnapshot = await adminDb.collection('ordenes-trabajo').get();

    // --- ¡ARREGLO 2! ---
    // Usamos 'as unknown as' para forzar el tipo (como hicimos en 'registros-acceso')
    // Así TypeScript sabrá que 'patente' y 'fechaCreacion' existen.
    const todasLasOTs = otSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as OrdenDeTrabajo[];

    
    let reporteFiltrado = todasLasOTs;

    // Filtro por Estado (sin cambios)
    if (estado && estado !== 'Todos') {
      reporteFiltrado = reporteFiltrado.filter(ot => ot.estado === estado);
    }

    // Filtro por Patente (sin cambios, pero ahora funciona)
    if (patente) {
      reporteFiltrado = reporteFiltrado.filter(ot => 
        ot.patente && ot.patente.toLowerCase().includes(patente.toLowerCase())
      );
    }

    // --- ¡ARREGLO 3! ---
    // Usamos .toMillis() en lugar de ._seconds
    
    // Filtro por Fecha de Inicio
    if (fechaInicio) {
      const inicioTimestamp = new Date(fechaInicio).getTime(); 
      reporteFiltrado = reporteFiltrado.filter(ot => 
        ot.fechaCreacion && ot.fechaCreacion.toMillis() >= inicioTimestamp
      );
    }

    // Filtro por Fecha de Fin
    if (fechaFin) {
      // Sumamos 1 día (en milisegundos) para incluir el día completo
      const finTimestamp = new Date(fechaFin).getTime() + (24 * 60 * 60 * 1000); 
      reporteFiltrado = reporteFiltrado.filter(ot => 
        ot.fechaCreacion && ot.fechaCreacion.toMillis() <= finTimestamp
      );
    }
    // --- FIN DE LOS ARREGLOS ---

    console.log(`Reporte generado: ${reporteFiltrado.length} resultados.`);

    // 5. Responde con la lista ya filtrada
    return NextResponse.json(reporteFiltrado);

  } catch (error) {
    console.error("Error en GET /api/reportes:", error);
    return NextResponse.json({ error: 'Error al generar el reporte' }, { status: 500 });
  }
}