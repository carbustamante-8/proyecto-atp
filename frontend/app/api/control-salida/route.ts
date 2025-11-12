// app/api/control-salida/route.ts
// (CÓDIGO CORREGIDO: Se cambia la consulta para evitar el error de índice)

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * Función PUT: (¡CORREGIDA CON VALIDACIÓN SIN ÍNDICE!)
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
    
    const patenteVehiculo = registroDoc.data()?.patente;
    if (!patenteVehiculo) {
      return NextResponse.json({ error: 'El registro de ingreso no tiene patente.' }, { status: 400 });
    }

    // 2. --- ¡VALIDACIÓN CORREGIDA (Sin índice compuesto)! ---
    console.log(`Validando OTs activas para patente: ${patenteVehiculo}...`);

    // Paso 1: Trae TODAS las OTs de esa patente (esto usa un índice simple automático)
    const otSnapshot = await adminDb.collection('ordenes-trabajo')
      .where('patente', '==', patenteVehiculo)
      .get();

    // Paso 2: Filtra los estados activos en el código del servidor
    const estadosActivos = ['Agendado', 'Pendiente', 'En Progreso'];
    const otsActivas = otSnapshot.docs.filter(doc => {
      const estado = doc.data().estado;
      return estadosActivos.includes(estado);
    });

    if (otsActivas.length > 0) {
      // ¡Error! Se encontraron OTs activas.
      const otActiva = otsActivas[0].data(); // Tomamos la primera
      const mecanico = otActiva.mecanicoAsignadoNombre || 'No asignado';
      
      console.warn(`SALIDA NO AUTORIZADA: La patente ${patenteVehiculo} tiene una OT en estado "${otActiva.estado}".`);
      
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