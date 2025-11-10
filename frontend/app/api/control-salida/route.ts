// app/api/control-salida/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * Función PUT: (¡CORREGIDA!)
 * Ahora recibe un ID único y marca la salida.
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Lee el ID único que envió el formulario del Guardia
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID del registro' }, { status: 400 });
    }

    console.log(`PUT /api/control-salida: Registrando salida para ID: ${id}`);

    // 2. Busca el documento EXACTO por su ID
    const registroRef = adminDb.collection('registros-acceso').doc(id);
    const registroDoc = await registroRef.get();

    if (!registroDoc.exists) {
      return NextResponse.json({ error: 'Registro de ingreso no encontrado.' }, { status: 404 });
    }

    // 3. ¡Lo encontramos! Actualiza la fecha de salida
    await registroRef.update({
      fechaSalida: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ message: 'Salida registrada exitosamente', id: registroDoc.id });

  } catch (error) {
    console.error("Error en PUT /api/control-salida:", error);
    return NextResponse.json({ error: 'Error al registrar la salida' }, { status: 500 });
  }
}