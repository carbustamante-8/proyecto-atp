// frontend/app/api/registros-acceso/route.ts
// (CÓDIGO CORREGIDO: 'fechaSalida' añadido al tipo)

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin'; // (Usamos la ruta relativa)
import * as admin from 'firebase-admin';

// --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
// Le decimos a TypeScript cómo se ven nuestros datos
type RegistroDoc = {
  id: string;
  tipo: 'INGRESO' | 'SALIDA';
  fechaIngreso: admin.firestore.Timestamp;
  fechaSalida?: admin.firestore.Timestamp; // <-- 1. AÑADIMOS EL CAMPO (con '?' porque es opcional)
}
// --- FIN DE LA CORRECCIÓN ---

// --- FUNCIÓN GET (Corregida) ---
export async function GET() {
  try {
    console.log('GET /api/registros-acceso: Obteniendo ingresos ABIERTOS...');

    const registrosSnapshot = await adminDb.collection('registros-acceso').get();
    
    // 2. Le damos el "tipo" para que TypeScript no se queje
    const registros = registrosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as RegistroDoc[]; 

    // 3. Filtramos y Ordenamos
    const registrosDeIngreso = registros
      .filter(reg => reg.tipo === 'INGRESO' && !reg.fechaSalida) // <-- Ahora SÍ funciona
      .sort((a, b) => b.fechaIngreso.toMillis() - a.fechaIngreso.toMillis()); // (Usamos .toMillis() que es más seguro)

    // 4. Responde con la lista ya filtrada y ordenada
    return NextResponse.json(registrosDeIngreso);

  } catch (error) {
    console.error("Error en GET /api/registros-acceso:", error);
    return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 });
  }
}


// --- FUNCIÓN POST (Sin cambios, sigue igual) ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    
    if (!body.patente || !body.chofer || !body.motivoIngreso || !body.numeroChasis || !body.zonaOrigen) {
      return NextResponse.json({ error: 'Faltan datos (Patente, Chofer, Motivo, Chasis, Zona)' }, { status: 400 });
    }

    console.log('POST /api/registros-acceso: Creando nuevo registro...');
    
    const nuevoRegistroRef = await adminDb.collection('registros-acceso').add({
      patente: body.patente,
      chofer: body.chofer,
      motivoIngreso: body.motivoIngreso,
      numeroChasis: body.numeroChasis,
      zonaOrigen: body.zonaOrigen,
      fechaIngreso: admin.firestore.FieldValue.serverTimestamp(), 
      tipo: 'INGRESO', 
      fechaSalida: null, // (Es buena idea iniciarlo en null)
    });

    return NextResponse.json({ id: nuevoRegistroRef.id, ...body }, { status: 201 });

  } catch (error) {
    console.error("Error en POST /api/registros-acceso:", error);
    return NextResponse.json({ error: 'Error al crear el registro' }, { status: 500 });
  }
}