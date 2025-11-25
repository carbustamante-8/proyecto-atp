import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Falta nombre' }, { status: 400 });
  }

  const arrayBuffer = await request.arrayBuffer();

  if (arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'Archivo vacío' }, { status: 400 });
  }

  const blob = await put(filename, arrayBuffer, {
    access: 'public',
    contentType: 'image/jpeg',
  });

  return NextResponse.json(blob);
}