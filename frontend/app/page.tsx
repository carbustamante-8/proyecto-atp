// frontend/app/page.tsx
// (CÓDIGO REDISEÑADO: MODERNO, ALINEADO Y CON MARCA PEPSI)

'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; 
import { useAuth } from '@/context/AuthContext'; // Mantener el import para la funcionalidad
import toast from 'react-hot-toast';
import { ArrowRightIcon } from '@heroicons/react/24/outline'; // Icono para el botón

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // SOLUCIÓN: Usar useAuth como un tipo explícito para forzar la re-evaluación de la interfaz
  const authContext = useAuth();
  // Desestructuración segura:
  const { login, user, userProfile } = authContext;
  
  const router = useRouter();

  // Lógica de redirección (CRÍTICA: NO TOCAR)
  useEffect(() => {
    if (user && userProfile) {
      // Redirección basada en el rol
      const rol = userProfile.rol;
      if (rol === 'Conductor') router.push('/portal-conductor');
      else if (rol === 'Mecánico') router.push('/mis-tareas');
      else if (rol === 'Guardia') router.push('/control-acceso');
      else if (['Supervisor', 'Coordinador', 'Jefe de Taller'].includes(rol)) {
        router.push('/dashboard-admin');
      }
      else if (rol === 'Gerente') router.push('/generador-reportes');
      else router.push('/dashboard-admin'); // Fallback
    }
  }, [user, userProfile, router]);

  // Lógica de HandleSubmit (CRÍTICA: NO TOCAR)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      // El useEffect anterior se encargará de la redirección
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        toast.error('Credenciales inválidas. Revisa tu email y contraseña.');
      } else {
        toast.error('Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // El componente de carga inicial debe estar en layout.tsx, pero lo mantenemos aquí si el layout no lo gestiona.
  // Si user es null y loading es false, mostramos el formulario.
  if (user && userProfile) {
    // Si la redirección aún no ocurre, mostramos una pantalla de carga para evitar el parpadeo.
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
            <p className="text-xl text-neutral-700">Redirigiendo...</p>
        </div>
    );
  }


  // --- RENDERIZADO CON DISEÑO PEPSI ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      
      <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 border border-gray-200">
        
        {/* 1. Logo de PepsiCo */}
        <div className="flex justify-center mb-6">
          
          <Image
            src="/pepsico-logo.png" 
            alt="Logo PepsiCo"
            width={150}
            height={40}
            priority
          />
        </div>

        {/* 2. Título */}
        <h1 className="text-2xl font-bold text-center text-neutral-900 mb-2">
          Control de Taller
        </h1>
        <p className="text-center text-neutral-600 mb-6">
          Inicia sesión para acceder al sistema.
        </p>

        {/* 3. Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email */}
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

          {/* Contraseña */}
          <div>
            <label 
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50 focus:ring-pepsi-blue focus:border-pepsi-blue"
              placeholder="••••••••"
            />
          </div>

          {/* Link de Recuperar Contraseña */}
          <div className="text-right">
            <Link href="/recuperar-contrasena">
              <span className="text-sm text-pepsi-blue hover:text-pepsi-blue-dark font-medium cursor-pointer">
                ¿Olvidaste tu contraseña?
              </span>
            </Link>
          </div>

          {/* Botón de Ingreso (Color Pepsi) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white 
                       bg-pepsi-blue hover:bg-pepsi-blue-dark 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pepsi-blue
                       disabled:bg-gray-400 transition-colors duration-200"
          >
            {loading ? (
              <>
                {/* Spinner de carga */}
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ingresando...
              </>
            ) : (
              <>
                Ingresar
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}