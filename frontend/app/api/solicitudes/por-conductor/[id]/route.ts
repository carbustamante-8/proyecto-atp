// frontend/app/api/solicitudes/por-conductor/[id]/route.ts
// (API NUEVA: Busca las solicitudes de un conductor y el estado de sus OTs)

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin'; // (Ruta relativa larga)

// Define el tipo de 'context' que Vercel espera
type Context = {
  params: Promise<{ id: string }> // El 'id' aquí es el ID del CONDUCTOR
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

    // --- ¡CORRECCIÓN DE ÍNDICE! ---
    // 1. Busca todas las solicitudes (SIN ORDENAR)
    const solicitudesSnapshot = await adminDb.collection('solicitudes')
      .where('id_conductor', '==', idConductor)
      .get(); // <-- Se quita el .orderBy() para evitar error de índice

    if (solicitudesSnapshot.empty) {
      return NextResponse.json([]); // Devuelve un array vacío si no tiene solicitudes
    }

    const solicitudesConEstado = [];

    // 2. Itera sobre cada solicitud y busca el estado de la OT
    for (const doc of solicitudesSnapshot.docs) {
      const solicitud = doc.data();
      let estadoOT = null; 
      let fechaHoraAgendada = null; // ¡NUEVO!

      if (solicitud.id_ot_relacionada) {
        const otRef = adminDb.collection('ordenes-trabajo').doc(solicitud.id_ot_relacionada);
        const otDoc = await otRef.get();
        
        if (otDoc.exists) {
          estadoOT = otDoc.data()?.estado; 
          fechaHoraAgendada = otDoc.data()?.fechaHoraAgendada || null; // ¡NUEVO!
        }
      }

      solicitudesConEstado.push({
        id: doc.id,
        descripcion: solicitud.descripcion_falla,
        fechaSolicitud: solicitud.fechaCreacion,
        estadoSolicitud: solicitud.estado, 
        estadoOT: estadoOT, 
        fechaHoraAgendada: fechaHoraAgendada, // ¡NUEVO!
      });
    }
    
    // 3. Ordena los resultados en el servidor (evita error de índice)
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