// app/api/repuestos/route.ts

import { NextResponse } from 'next/server';
// 1. IMPORTA LA LLAVE MAESTRA (Conexión Admin)
import { adminDb } from '@/lib/firebase-admin';

/**
 * Función GET: Se ejecuta cuando tu vista de "Gestión de Repuestos"
 * pida la lista de repuestos.
 */
export async function GET() {
  try {
    console.log('GET /api/repuestos: Obteniendo lista de repuestos...');

    // 2. USA LA CONEXIÓN ADMIN para hablar con Firestore
    // Esta vez, apunta a la colección "repuestos"
    const repuestosSnapshot = await adminDb.collection('repuestos').get();

    // 3. Convierte los datos a un formato JSON simple
    const repuestos = repuestosSnapshot.docs.map(doc => ({
      id: doc.id, // El ID único del documento
      ...doc.data(), // El resto de los datos (codigo, nombre, marca, etc.)
    }));

    // 4. Responde con la lista de repuestos
    return NextResponse.json(repuestos);

  } catch (error) {
    console.error("Error en GET /api/repuestos:", error);
    return NextResponse.json({ error: 'Error al obtener repuestos' }, { status: 500 });
  }
}


/**
 * Función POST: Se ejecuta cuando tu formulario "Añadir Nuevo Repuesto"
 * envíe los datos.
 */
export async function POST(request: Request) {
  try {
    // 1. Lee los datos que envió el formulario (basado en tu maqueta)
    const body = await request.json(); 
    
    console.log('POST /api/repuestos: Creando nuevo repuesto...');
    console.log('Datos recibidos:', body);

    // 2. USA LA CONEXIÓN ADMIN para CREAR un nuevo documento en Firestore
    // ¡Firestore creará la colección "repuestos" si no existe!
    const nuevoRepuestoRef = await adminDb.collection('repuestos').add({
      codigo: body.codigo,
      nombre: body.nombre,
      marca: body.marca,
      descripcion: body.descripcion,
      // (Podríamos añadir "stock: 0" como valor inicial)
    });

    // 3. Responde con los datos del repuesto creado
    return NextResponse.json({ id: nuevoRepuestoRef.id, ...body }, { status: 201 });

  } catch (error) {
    console.error("Error en POST /api/repuestos:", error);
    return NextResponse.json({ error: 'Error al crear el repuesto' }, { status: 500 });
  }
}