// frontend/app/api/repuestos/route.ts
// (AÑADIDA LA FUNCIÓN DELETE)

import { NextResponse, NextRequest } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin'; 

// --- GET (Sin cambios) ---
export async function GET() {
  try {
    const repuestosSnapshot = await adminDb.collection('repuestos').get();
    const repuestos = repuestosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(repuestos);
  } catch (error) {
    console.error("Error en GET /api/repuestos:", error);
    return NextResponse.json({ error: 'Error al obtener repuestos' }, { status: 500 });
  }
}

// --- POST (Sin cambios) ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    if (!body.codigo || !body.nombre) {
      return NextResponse.json({ error: 'Código y Nombre son obligatorios' }, { status: 400 });
    }
    const nuevoRepuestoRef = await adminDb.collection('repuestos').add({
      codigo: body.codigo,
      nombre: body.nombre,
      marca: body.marca,
      descripcion: body.descripcion,
    });
    return NextResponse.json({ id: nuevoRepuestoRef.id, ...body }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/repuestos:", error);
    return NextResponse.json({ error: 'Error al crear el repuesto' }, { status: 500 });
  }
}

// --- ¡FUNCIÓN DELETE (NUEVA)! ---
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repuestoId = searchParams.get('id');

    if (!repuestoId) {
      return NextResponse.json({ error: 'Falta el ID del repuesto' }, { status: 400 });
    }

    console.log(`DELETE /api/repuestos: Borrando repuesto con ID: ${repuestoId}`);

    await adminDb.collection('repuestos').doc(repuestoId).delete();

    return NextResponse.json({ message: 'Repuesto eliminado exitosamente' });

  } catch (error) {
    console.error("Error en DELETE /api/repuestos:", error);
    return NextResponse.json({ error: 'Error al eliminar el repuesto' }, { status: 500 });
  }
}