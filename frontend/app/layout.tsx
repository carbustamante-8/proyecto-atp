// frontend/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar'; 

const inter = Inter({ subsets: ['latin'] });

// --- ¡ESTE ES EL ARREGLO! ---
// Un solo objeto de metadata simple para todo el sitio.
export const metadata: Metadata = {
  title: 'Pepsi-Fleet', // Este será el título en todas las pestañas
  description: 'Gestión de Flota ATP',
};
// --- FIN DEL ARREGLO ---

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar /> 
          {children} 
        </AuthProvider>
      </body>
    </html>
  );
}