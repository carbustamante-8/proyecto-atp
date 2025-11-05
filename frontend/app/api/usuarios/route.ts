// app/api/usuarios/route.ts

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// ... (Aquí está tu función GET, que ya existe) ...
export async function GET() {
  // ... tu código GET ...
}

// ... (Aquí está tu función POST, que ya existe) ...
export async function POST(request: Request) {
  // ... tu código POST ...
}


// --- ¡AÑADE ESTA NUEVA FUNCIÓN! ---

/**
 * Función DELETE: Se ejecuta cuando el frontend pide borrar un usuario.
 * Recibirá el ID del usuario por la URL (ej: /api/usuarios?id=abc12345)
 */
export async function DELETE(request: Request) {
  try {
    // 1. Obtiene la URL y saca el ID del usuario
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'Falta el ID del usuario' }, { status: 400 });
    }

    console.log(`DELETE /api/usuarios: Borrando usuario con ID: ${userId}`);

    // 2. USA LA LLAVE MAESTRA para borrar el documento de Firestore
    await adminDb.collection('usuarios').doc(userId).delete();

    // 3. Responde con un mensaje de éxito
    return NextResponse.json({ message: 'Usuario eliminado exitosamente' });

  } catch (error) {
    console.error("Error en DELETE /api/usuarios:", error);
    return NextResponse.json({ error: 'Error al eliminar el usuario' }, { status: 500 });
  }
}