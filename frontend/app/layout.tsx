import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css"; // <- Esto importa el CSS
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: '--font-poppins',
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
      {/* ¡AQUÍ ESTÁ LA CORRECCIÓN!
        Quitamos la clase 'bg-background' del body.
        El color de fondo se aplicará desde globals.css
      */}
      <body className={poppins.className}> {/* ANTES: ${poppins.className} bg-background */}
        <AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{ className: 'font-sans' }}
          />
          <Navbar />
          <main className="pt-16">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}