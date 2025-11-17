import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css"; // ¡Esto ahora funciona!
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";

// Configura la fuente Poppins
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

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
      {/* Aplicamos la fuente Poppins al body */}
      <body className={poppins.className}>
        <AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'font-sans', // Asegura que los toasts usen la fuente
            }}
          />
          {/* El Navbar ahora se renderiza aquí */}
          <Navbar />
          
          {/* Contenido principal con padding-top para el Navbar fijo */}
          <main className="pt-16">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}