// frontend/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar'; 
// --- ¡CAMBIO 1: Importa el Toaster! ---
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pepsi-Fleet', 
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
          
          {/* --- ¡CAMBIO 2: Añade el Toaster aquí! --- */}
          {/* (Se puede poner arriba o abajo, no afecta el layout) */}
          <Toaster 
            position="bottom-right" // Las notificaciones saldrán en la esquina inferior derecha
            toastOptions={{
              duration: 4000, // Duran 4 segundos
            }}
          />
          
          <Navbar /> 
          {children} 
        
        </AuthProvider>
      </body>
    </html>
  );
}