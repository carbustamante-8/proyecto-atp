// app/api/control-salida/route.ts
// (CÓDIGO ACTUALIZADO: Añade la validación de OTs)

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * Función PUT: (¡CORREGIDA CON VALIDACIÓN!)
 * Ahora recibe un ID único y marca la salida, SÓLO SI no hay OTs abiertas.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body; // ID del documento 'registros-acceso'

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID del registro' }, { status: 400 });
    }

    console.log(`PUT /api/control-salida: Iniciando validación de salida para ID: ${id}`);

    // 1. Busca el registro de ingreso para obtener la patente
    const registroRef = adminDb.collection('registros-acceso').doc(id);
    const registroDoc = await registroRef.get();

    if (!registroDoc.exists) {
      return NextResponse.json({ error: 'Registro de ingreso no encontrado.' }, { status: 404 });
    }
    
    // Obtenemos la patente del vehículo que intenta salir
    const patenteVehiculo = registroDoc.data()?.patente;
    if (!patenteVehiculo) {
      return NextResponse.json({ error: 'El registro de ingreso no tiene patente.' }, { status: 400 });
    }

    // 2. --- ¡NUEVA VALIDACIÓN (CU-02)! ---
    // Busca en 'ordenes-trabajo' OTs para esta patente que NO estén "Finalizado"
    console.log(`Validando OTs activas para patente: ${patenteVehiculo}...`);
    const otActivasSnapshot = await adminDb.collection('ordenes-trabajo')
      .where('patente', '==', patenteVehiculo)
      .where('estado', '!=', 'Finalizado') // Busca 'Pendiente' o 'En Progreso'
      .get();

    if (!otActivasSnapshot.empty) {
      // ¡Error! Se encontraron OTs activas.
      const otActiva = otActivasSnapshot.docs[0].data();
      const mecanico = otActiva.mecanicoAsignadoNombre || 'No asignado';
      
      console.warn(`SALIDA NO AUTORIZADA: La patente ${patenteVehiculo} tiene una OT en estado "${otActiva.estado}".`);
      
      // Esto cumple con el Curso Alterno 2.a del CU-02 
      return NextResponse.json({ 
        error: `¡Salida NO AUTORIZADA! La OT sigue en estado "${otActiva.estado}" (Asignada a: ${mecanico}).` 
      }, { status: 403 }); // 403 = Prohibido
    }
    // --- FIN DE LA VALIDACIÓN ---

    // 3. ¡Éxito! No hay OTs activas. Procede a registrar la salida.
    console.log(`Validación exitosa. Registrando salida para: ${patenteVehiculo}`);
    await registroRef.update({
      fechaSalida: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ message: 'Salida registrada exitosamente', id: registroDoc.id });

  } catch (error) {
    console.error("Error en PUT /api/control-salida:", error);
    return NextResponse.json({ error: 'Error al registrar la salida' }, { status: 500 });
  }
}