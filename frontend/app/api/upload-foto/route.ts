import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Falta el nombre del archivo' }, { status: 400 });
    }

    // --- CORRECCIÓN CRÍTICA ---
    // Leemos el archivo completo en memoria antes de subirlo.
    // Esto evita que se guarde un archivo "fantasma" de 0 bytes.
    const arrayBuffer = await request.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
        return NextResponse.json({ error: 'El archivo está vacío o corrupto' }, { status: 400 });
    }

    // Subimos el archivo real a Vercel
    const blob = await put(filename, arrayBuffer, {
      access: 'public',
      contentType: 'image/jpeg', // Ayuda al navegador a mostrarlo
    });

    return NextResponse.json(blob);

  } catch (error: any) {
    console.error("Error subiendo foto:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}