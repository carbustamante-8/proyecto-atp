// frontend/app/api/upload-foto/route.ts

import { put } from '@vercel/blob'; 
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  // --- ¡LÍNEA DE DEBUG ELIMINADA! (Era console.log("VIENDO LA LLAVE...")) ---

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'No se proveyó un nombre de archivo.' }, { status: 400 });
  }

  if (!request.body) {
    return NextResponse.json({ error: 'No se proveyó un archivo.' }, { status: 400 });
  }

  // Sube el archivo a Vercel Blob
  const blob = await put(filename, request.body, {
    access: 'public', 
  });

  // Responde al frontend con la URL pública de la foto
  return NextResponse.json(blob);
}