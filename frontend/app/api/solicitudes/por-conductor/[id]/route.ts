// frontend/app/api/solicitudes/por-conductor/[id]/route.ts
// (CÓDIGO CORREGIDO: Se quita el .orderBy() de la consulta y se ordena en el servidor)

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin'; // (Ruta relativa larga)

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

    console.log(`GET /api/solicitudes/por-conductor: Buscando solicitudes para Conductor ID: ${idConductor}`);

    // --- ¡CORRECCIÓN! ---
    // 1. Busca todas las solicitudes (SIN ORDENAR)
    const solicitudesSnapshot = await adminDb.collection('solicitudes')
      .where('id_conductor', '==', idConductor)
      .get(); // <-- Se quitó el .orderBy()

    if (solicitudesSnapshot.empty) {
      return NextResponse.json([]); 
    }

    const solicitudesConEstado = [];

    // 2. Itera y busca el estado de la OT (sin cambios)
    for (const doc of solicitudesSnapshot.docs) {
      const solicitud = doc.data();
      let estadoOT = null; 
      let fechaIngresoTaller = null; 

      if (solicitud.id_ot_relacionada) {
        const otRef = adminDb.collection('ordenes-trabajo').doc(solicitud.id_ot_relacionada);
        const otDoc = await otRef.get();
        
        if (otDoc.exists) {
          estadoOT = otDoc.data()?.estado; 
          fechaIngresoTaller = otDoc.data()?.fechaIngresoTaller || null;
        }
      }

      solicitudesConEstado.push({
        id: doc.id,
        descripcion: solicitud.descripcion_falla,
        fechaSolicitud: solicitud.fechaCreacion,
        estadoSolicitud: solicitud.estado, 
        estadoOT: estadoOT, 
        fechaIngresoTaller: fechaIngresoTaller, 
      });
    }

    // --- ¡CORRECCIÓN! ---
    // 3. Ordena los resultados aquí, en el código, ANTES de enviarlos
    solicitudesConEstado.sort((a, b) => {
      const timeA = a.fechaSolicitud?._seconds || 0;
      const timeB = b.fechaSolicitud?._seconds || 0;
      return timeB - timeA; // Descendente (más nuevo primero)
    });

    // 4. Devuelve la lista combinada y ordenada
    return NextResponse.json(solicitudesConEstado);

  } catch (error) {
    console.error(`Error en GET /api/solicitudes/por-conductor/[id]:`, error); 
    return NextResponse.json({ error: 'Error al obtener las solicitudes' }, { status: 500 });
  }
}