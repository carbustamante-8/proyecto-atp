// frontend/app/recuperar-contrasena/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

// IMPORTACIONES DIRECTAS DE FIREBASE
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '@/lib/firebase'; // Asumiendo que /lib/firebase.ts inicializa la app

const auth = getAuth(app);

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensajeEnviado, setMensajeEnviado] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validar email básico antes de enviar
    if (!email.includes('@') || !email.includes('.')) {
        toast.error('Por favor, ingresa un correo electrónico válido.');
        setLoading(false);
        return;
    }

    try {
      // Llama directamente a la función de Firebase para el reseteo
      await sendPasswordResetEmail(auth, email);
      
      setMensajeEnviado(true);
      toast.success('¡Enlace de recuperación enviado!');
      
    } catch (error: any) {
      console.error("Error al enviar email de recuperación:", error);
      
      if (error.code === 'auth/user-not-found') {
        toast.error('No hay una cuenta registrada con ese correo.');
      } else {
        toast.error('Ocurrió un error al intentar enviar el enlace.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // --- RENDERIZADO CON DISEÑO PEPSI ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 border border-gray-200">
        
        {/* Logo de PepsiCo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/pepsico-logo.png" 
            alt="Logo PepsiCo"
            width={150}
            height={40}
            priority
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-neutral-900 mb-2">
          Recuperar Contraseña
        </h1>
        <p className="text-center text-neutral-600 mb-6">
          Ingresa tu correo para recibir un enlace para restablecer tu clave.
        </p>

        {mensajeEnviado ? (
          <div className="text-center p-6 bg-green-50 border border-green-200 rounded-md">
            <p className="font-semibold text-green-700 mb-4">
              Hemos enviado un enlace de recuperación a <strong className="break-all">{email}</strong>. Por favor, revisa tu bandeja de entrada.
            </p>
            <Link href="/">
              <span className="text-sm text-pepsi-blue hover:text-pepsi-blue-dark font-medium cursor-pointer">
                Volver a la página de inicio de sesión
              </span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Input */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50 focus:ring-pepsi-blue focus:border-pepsi-blue"
                placeholder="tu@correo.com"
              />
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white 
                         bg-pepsi-red hover:bg-red-700 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pepsi-red
                         disabled:bg-gray-400 transition-colors duration-200"
            >
              {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
            </button>
            
            {/* Link de Retorno */}
            <div className="text-center pt-2">
              <Link href="/">
                <span className="text-sm text-neutral-600 hover:text-neutral-900 font-medium cursor-pointer">
                  Cancelar y Volver al Login
                </span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}