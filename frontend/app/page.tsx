'use client'; 
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast'; 

// ¡YA NO SE USA page.module.css!

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // (La lógica de 'useAuth' y 'useEffect' para redirigir es idéntica)
  const { user, userProfile, loading: authLoading } = useAuth(); 

  useEffect(() => {
    if (!authLoading && user && userProfile) {
      if (userProfile.rol === 'Jefe de Taller') {
        router.push('/agenda-taller');
      } else if (userProfile.rol === 'Supervisor') {
        router.push('/dashboard-admin'); 
      } else if (userProfile.rol === 'Coordinador') {
        router.push('/dashboard-admin'); 
      } else if (userProfile.rol === 'Mecánico') {
        router.push('/mis-tareas'); 
      } else if (userProfile.rol === 'Guardia') {
        router.push('/control-acceso'); 
      } else if (userProfile.rol === 'Conductor') {
        router.push('/portal-conductor'); 
      } else if (userProfile.rol === 'Gerente') {
        router.push('/generador-reportes'); 
      } else {
        router.push('/'); 
      }
    }
  }, [user, userProfile, authLoading, router]);

  // (La lógica de 'handleLogin' es idéntica)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    toast.loading('Iniciando sesión...'); 
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.dismiss();
      
    } catch (error: any) {
      toast.dismiss();
      console.error("Error en login:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        toast.error('Email o contraseña incorrectos.');
      } else {
        toast.error(error.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false); 
    }
  };

  // Muestra pantalla de carga si la sesión se está validando
  if (authLoading || (user && userProfile)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-neutral-50">
        <p className="text-neutral-700">Validando sesión...</p>
      </div>
    );
  }
  
  // --- JSX del Login (Rediseñado 100% con Tailwind v3) ---
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
        <h2 className="text-3xl font-semibold text-center mt-6 text-shadow-lg">
          Gestión de Flota y Taller Mecánico
        </h2>
      </div>
      
      {/* Columna Derecha (Formulario) */}
      {/* El fondo 'bg-neutral-50' ya está en el body (globals.css) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="bg-white p-10 rounded-lg shadow-card max-w-md w-full">
          
          <h2 className="text-3xl font-bold text-center text-neutral-900 mb-8">
            Iniciar Sesión
          </h2>
          
          <form onSubmit={handleLogin} className="space-y-6">
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
                className="w-full px-4 py-3 rounded-md border bg-neutral-100 border-gray-300 focus:outline-none focus:ring-2 focus:ring-pepsi-blue-light focus:border-transparent transition-shadow duration-200"
              />
            </div>

            {/* Grupo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-md border bg-neutral-100 border-gray-300 focus:outline-none focus:ring-2 focus:ring-pepsi-blue-light focus:border-transparent transition-shadow duration-200"
              />
            </div>

            {/* Botón de Ingresar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pepsi-blue text-white py-3 rounded-md font-semibold hover:bg-pepsi-blue-dark transition-colors duration-200 disabled:bg-gray-400"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
            
            {/* Link de Recuperar Contraseña */}
            <div className="text-center pt-2">
              <Link href="/recuperar-contrasena">
                <span className="text-sm font-medium text-pepsi-blue-light hover:text-pepsi-blue-dark hover:underline cursor-pointer">
                  ¿Olvidaste tu contraseña?
                </span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}