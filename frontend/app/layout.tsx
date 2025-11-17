// frontend/app/layout.tsx
// (ACTUALIZADO: Importa la fuente 'Poppins' y la aplica)

import type { Metadata } from "next";
// --- ¡CAMBIO DE FUENTE! ---
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";

// Configura la fuente Poppins
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: '--font-poppins', // Opcional si quieres usarla como variable
});
// --- FIN CAMBIO DE FUENTE ---

export const metadata: Metadata = {
  title: "Pepsi-Fleet",
  description: "Gestión de Taller y Flota - PepsiCo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      {/* ¡Aplica la fuente y el color de fondo! */}
      <body className={`${poppins.className} bg-background`}>
        <AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'font-sans', // Asegura que los toasts usen la fuente
            }}
          />
          <Navbar />
          {/* Este 'main' es importante. 
            El Navbar ahora es FIJO (fixed), así que el contenido principal 
            necesita un padding-top (pt-16) para no quedar oculto debajo.
          */}
          <main className="pt-16">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}