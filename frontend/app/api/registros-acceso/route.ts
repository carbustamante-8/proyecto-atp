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
// --- FUNCIÓN GET (CORREGIDA) ---
export async function GET() {
  try {
    console.log('GET /api/registros-acceso: Obteniendo ingresos ABIERTOS...');

    const registrosSnapshot = await adminDb.collection('registros-acceso').get();
    
    const registros = registrosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as any[]; // (Usamos 'any' por simplicidad aquí)

    // --- ¡AQUÍ ESTÁ LA LÓGICA CORREGIDA! ---
    const registrosAbiertos = registros
      // 1. Filtra solo 'INGRESO'
      .filter(reg => reg.tipo === 'INGRESO')
      // 2. Y que NO tengan fechaSalida
      .filter(reg => !reg.fechaSalida) 
      // 3. Ordena (más nuevos primero)
      .sort((a, b) => b.fechaIngreso._seconds - a.fechaIngreso._seconds); 

    return NextResponse.json(registrosAbiertos);

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