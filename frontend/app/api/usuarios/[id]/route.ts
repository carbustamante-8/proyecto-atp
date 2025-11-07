// app/api/usuarios/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
// Usamos la ruta relativa larga para asegurar que funcione
import { adminDb } from '../../../../lib/firebase-admin'; 

// Define el tipo de 'context' que Vercel espera
type Context = {
  params: Promise<{ id: string }>
}

/**
 * Función GET: Obtiene UN usuario específico por su ID.
 * (La página "Editar Usuario" llamará a esto para rellenar el formulario)
 */
export async function GET(
  request: NextRequest, 
  context: Context
) {
  let id: string;
  try {
    const params = await context.params;
    id = params.id; 
    
    // Busca el documento en Firestore
    const userDoc = await adminDb.collection('usuarios').doc(id).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Responde con los datos del usuario
    return NextResponse.json({ id: userDoc.id, ...userDoc.data() });

  } catch (error) {
    console.error(`Error en GET /api/usuarios/[id]:`, error); 
    return NextResponse.json({ error: 'Error al obtener el usuario' }, { status: 500 });
  }
}


/**
 * Función PUT: Actualiza UN usuario específico (Nombre, Rol, Estado).
 * (El formulario "Editar Usuario" llamará a esto al guardar)
 */
export async function PUT(
  request: NextRequest, 
  context: Context
) {
  let id: string = 'ID_DESCONOCIDO'; 
  try {
    const params = await context.params;
    id = params.id; 
    
    // Lee los datos que envió el formulario de edición
    const body = await request.json(); 

    // Prepara los datos a actualizar (solo los campos permitidos)
    const datosParaActualizar: { 
      nombre?: string, 
      rol?: string, 
      estado?: string 
    } = {};

    if (body.nombre) datosParaActualizar.nombre = body.nombre;
    if (body.rol) datosParaActualizar.rol = body.rol;
    if (body.estado) datosParaActualizar.estado = body.estado;
    // (A propósito no dejamos cambiar el email aquí, es más complejo)

    if (Object.keys(datosParaActualizar).length === 0) {
      return NextResponse.json({ error: 'No se enviaron datos para actualizar' }, { status: 400 });
    }

    // Actualiza el documento en Firestore
    const userRef = adminDb.collection('usuarios').doc(id);
    await userRef.update(datosParaActualizar);

    return NextResponse.json({ message: 'Usuario actualizado exitosamente' });

  } catch (error) {
    console.error(`Error en PUT /api/usuarios/${id}:`, error); 
    return NextResponse.json({ error: 'Error al actualizar el usuario' }, { status: 500 });
  }
}