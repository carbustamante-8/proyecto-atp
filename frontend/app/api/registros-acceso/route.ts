// app/api/registros-acceso/route.ts

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// --- TIPO PARA ARREGLAR ERROR DE TYPESCRIPT ---
// Le decimos a TypeScript cómo se ven nuestros datos
type RegistroDoc = {
  id: string;
  tipo: 'INGRESO' | 'SALIDA';
  fechaIngreso: admin.firestore.Timestamp;
  // (y todos los otros campos: patente, chofer, etc.)
}

// --- FUNCIÓN GET (CORREGIDA) ---
/**
 * Función GET: Obtiene la lista de vehículos que han ingresado.
 */
export async function GET() {
  try {
    console.log('GET /api/registros-acceso: Obteniendo lista de ingresos...');

    // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
    // 1. Consulta "tonta": Pide TODOS los documentos, sin 'where' ni 'orderBy'.
    //    Esto NUNCA falla por falta de índice.
    const registrosSnapshot = await adminDb.collection('registros-acceso').get();
    
    // 2. Convierte los datos (y le da el "tipo" para que TypeScript no se queje)
    const registros = registrosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as RegistroDoc[]; // <// <-- Le decimos que es del tipo RegistroDoc

    // 3. Filtramos y Ordenamos aquí en el código (más fácil que en Firebase)
    const registrosDeIngreso = registros
      .filter(reg => reg.tipo === 'INGRESO') // Filtra solo 'INGRESO'
      .sort((a, b) => b.fechaIngreso.seconds - a.fechaIngreso.seconds); // Ordena por fecha (más nuevos primero)
    // 4. Responde con la lista ya filtrada y ordenada
    return NextResponse.json(registrosDeIngreso);

  } catch (error) {
    console.error("Error en GET /api/registros-acceso:", error);
    return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 });
  }
}


// --- (Tu función POST que ya existe y funciona va aquí abajo) ---
export async function POST(request: Request) {
  try {
    const body = await request.json(); 
    console.log('POST /api/registros-acceso: Creando nuevo registro...');
    
    const nuevoRegistroRef = await adminDb.collection('registros-acceso').add({
      patente: body.patente,
      chofer: body.chofer,
      motivoIngreso: body.motivoIngreso,
      kilometraje: body.kilometraje,
      zonaOrigen: body.zonaOrigen,
      fechaIngreso: admin.firestore.FieldValue.serverTimestamp(),
      tipo: 'INGRESO',
    });

    return NextResponse.json({ id: nuevoRegistroRef.id, ...body }, { status: 201 });

  } catch (error) {
    console.error("Error en POST /api/registros-acceso:", error);
    return NextResponse.json({ error: 'Error al crear el registro' }, { status: 500 });
  }
}