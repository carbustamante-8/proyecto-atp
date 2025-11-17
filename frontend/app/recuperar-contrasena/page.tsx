'use client'; 
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
// La ruta relativa '../lib/firebase' era incorrecta.
// Usamos el alias '@/lib/firebase' que está definido en tu tsconfig.json
// y es la forma correcta de importar en este proyecto.
import { auth } from '@/lib/firebase'; 
import { sendPasswordResetEmail } from 'firebase/auth';
import toast from 'react-hot-toast'; 

// --- ¡Estilo estándar para inputs (v3)! ---
const inputStyle = "w-full px-4 py-3 border border-gray-300 rounded-md text-neutral-900 bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-pepsi-blue-light focus:border-transparent transition-shadow duration-200";

export default function RecuperarContrasenaPage() {
  
  // (La lógica de 'useState', 'useRouter' y 'handle' queda idéntica)
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const promise = sendPasswordResetEmail(auth, email);
    
    toast.promise(promise, {
      loading: 'Enviando correo...',
      success: () => {
        setLoading(false);
        router.push('/'); // Redirige al login
        return '¡Correo enviado! Revisa tu bandeja de entrada.';
      },
      error: (err) => {
        setLoading(false);
        if (err.code === 'auth/user-not-found') {
          return 'No se encontró un usuario con ese correo.';
        }
        return 'Error al enviar el correo.';
      }
    });
  };

  // --- JSX REFACTORIZADO VISUALMENTE ---
  // (El JSX no tiene errores y se mantiene igual)
  return (
    <div className="flex min-h-screen font-sans">
      
      {/* Columna Izquierda (Branding Pepsi) */}
      <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-pepsi-blue text-white p-12">
        <Image
          src="/pepsico-logo.png"
          alt="PepsiCo Logo"
          width={300}  // Tamaño base
          height={283} // Proporción corregida (casi 1:1)
          priority
          className="object-contain" // Asegura que no se deforme
        />
        <h2 className="text-3xl font-semibold text-center mt-6">
          Gestión de Flota y Taller Mecánico
        </h2>
      </div>
      
      {/* Columna Derecha (Formulario) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-neutral-50">
        <div className="bg-white p-10 rounded-lg shadow-card max-w-md w-full">
          
          <h2 className="text-3xl font-bold text-center text-neutral-900 mb-4">
            Recuperar Contraseña
          </h2>
          <p className="text-center text-neutral-700 mb-8">
            Ingresa tu correo y te enviaremos un enlace para reestablecerla.
          </p>
          
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* Grupo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyle} // ¡Estilo estándar aplicado!
              />
            </div>

            {/* Botón de Enviar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pepsi-blue text-white py-3 rounded-md font-semibold hover:bg-pepsi-blue-dark transition-colors duration-200 disabled:bg-gray-400"
            >
              {loading ? 'Enviando...' : 'Enviar Correo'}
            </button>
            
            {/* Link de Volver al Login */}
            <div className="text-center pt-2">
              <Link href="/">
                <span className="text-sm font-medium text-pepsi-blue-light hover:text-pepsi-blue-dark hover:underline cursor-pointer">
                  Volver a Iniciar Sesión
                </span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}