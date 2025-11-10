// frontend/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar'; // <-- 1. IMPORTA LA NAVBAR

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pepsi-Fleet', // <-- Actualizado
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
        <AuthProvider>
          
          <Navbar /> {/* <-- 2. AÑADE LA NAVBAR AQUÍ */}
          
          {children} {/* (Las páginas se cargan aquí, debajo de la Navbar) */}
        
        </AuthProvider>
      </body>
    </html>
  );
}