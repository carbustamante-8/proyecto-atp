// frontend/app/api/registros-acceso/route.ts
// (CÓDIGO CORREGIDO: Quita 'kilometraje', añade 'numeroChasis')

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin'; // (Usamos la ruta relativa)
import * as admin from 'firebase-admin';

// --- FUNCIÓN GET (CORREGIDA - la que hicimos para el Jefe de Taller) ---
type RegistroDoc = {
  id: string;
  tipo: 'INGRESO' | 'SALIDA';
  fechaIngreso: admin.firestore.Timestamp;
}
export async function GET() {
  try {
    const registrosSnapshot = await adminDb.collection('registros-acceso').get();
    
    const registros = registrosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as RegistroDoc[]; 

    const registrosDeIngreso = registros
      .filter(reg => reg.tipo === 'INGRESO' && !reg.fechaSalida) // ¡Añadido !reg.fechaSalida!
      .sort((a, b) => b.fechaIngreso._seconds - a.fechaIngreso._seconds); 

    return NextResponse.json(registrosDeIngreso);
  } catch (error) {
    console.error("Error en GET /api/registros-acceso:", error);
    return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 });
  }
}

// --- FUNCIÓN POST (CORREGIDA) ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    
    // 1. Valida los nuevos campos
    if (!body.patente || !body.chofer || !body.motivoIngreso || !body.numeroChasis || !body.zonaOrigen) {
      return NextResponse.json({ error: 'Faltan datos (Patente, Chofer, Motivo, Chasis, Zona)' }, { status: 400 });
    }

    console.log('POST /api/registros-acceso: Creando nuevo registro...');
    
    // 2. Guarda los nuevos campos en Firestore
    const nuevoRegistroRef = await adminDb.collection('registros-acceso').add({
      patente: body.patente,
      chofer: body.chofer,
      motivoIngreso: body.motivoIngreso,
      numeroChasis: body.numeroChasis, // <-- AÑADIDO
      zonaOrigen: body.zonaOrigen,
      // kilometraje: body.kilometraje, // <-- ELIMINADO
      fechaIngreso: admin.firestore.FieldValue.serverTimestamp(), 
      tipo: 'INGRESO', 
    });

    return NextResponse.json({ id: nuevoRegistroRef.id, ...body }, { status: 201 });

  } catch (error) {
    console.error("Error en POST /api/registros-acceso:", error);
    return NextResponse.json({ error: 'Error al crear el registro' }, { status: 500 });
  }
}