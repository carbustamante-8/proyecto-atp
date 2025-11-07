// app/api/upload-foto/route.ts

import { put } from '@vercel/blob'; // Importa la función 'put' de Vercel Blob
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Obtiene el 'searchParam' de la URL (?filename=ejemplo.jpg)
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'No se proveyó un nombre de archivo.' }, { status: 400 });
  }

  // 2. Obtiene el archivo (el body) de la petición
  // ¡Importante! El 'body' de la petición DEBE ser el archivo en sí
  if (!request.body) {
    return NextResponse.json({ error: 'No se proveyó un archivo.' }, { status: 400 });
  }

  // 3. ¡LA MAGIA! Sube el archivo a Vercel Blob
  // Vercel usa automáticamente la llave BLOB_READ_WRITE_TOKEN
  const blob = await put(filename, request.body, {
    access: 'public', // Queremos que la foto sea pública para verla
  });

  // 4. Responde al frontend con la URL pública de la foto
  return NextResponse.json(blob);
}