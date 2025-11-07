// frontend/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// --- ¡NUESTROS CAMBIOS! ---
import { AuthProvider } from '@/context/AuthContext'; // 1. Importa el Proveedor

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Taller PepsiCo',
  description: 'Gestión de Flota ATP',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* 2. Envuelve a los 'children' con el Proveedor */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}