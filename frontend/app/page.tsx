// frontend/app/page.tsx
'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; 
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const authContext = useAuth();
  const { login, user, userProfile } = authContext;
  
  const router = useRouter();

  // Lógica de redirección CORREGIDA y LIMPIA
  useEffect(() => {
    if (user && userProfile) {
      const rol = userProfile.rol;

      // 1. Jefe de Taller -> Agenda
      if (rol === 'Jefe de Taller') {
        router.push('/agenda-taller'); 
      }
      // 2. Supervisor -> Agenda
      else if (rol === 'Supervisor') {
        router.push('/agenda-taller');
      }
      // 3. Coordinador -> Agenda (¡CORREGIDO!)
      else if (rol === 'Coordinador') {
        router.push('/agenda-taller');
      }
      // 4. Roles Operativos
      else if (rol === 'Conductor') router.push('/portal-conductor');
      else if (rol === 'Mecánico') router.push('/mis-tareas');
      else if (rol === 'Guardia') router.push('/control-acceso');
      else if (rol === 'Gerente') router.push('/generador-reportes');
      
      // 5. Fallback
      else {
        router.push('/dashboard-admin'); 
      }
    }
  }, [user, userProfile, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        toast.error('Credenciales inválidas.');
      } else {
        toast.error('Error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (user && userProfile) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
            <p className="text-xl text-neutral-700">Redirigiendo...</p>
        </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 border border-gray-200">
        <div className="flex justify-center mb-6">
          <Image src="/pepsico-logo.png" alt="Logo PepsiCo" width={150} height={40} priority />
        </div>
        <h1 className="text-2xl font-bold text-center text-neutral-900 mb-2">Control de Taller</h1>
        <p className="text-center text-neutral-600 mb-6">Inicia sesión para acceder al sistema.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">Correo Electrónico</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50 focus:ring-pepsi-blue focus:border-pepsi-blue"
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">Contraseña</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50 focus:ring-pepsi-blue focus:border-pepsi-blue"
              placeholder="••••••••"
            />
          </div>
          <div className="text-right">
            <Link href="/recuperar-contrasena">
              <span className="text-sm text-pepsi-blue hover:text-pepsi-blue-dark font-medium cursor-pointer">¿Olvidaste tu contraseña?</span>
            </Link>
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-pepsi-blue hover:bg-pepsi-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pepsi-blue disabled:bg-gray-400 transition-colors duration-200"
          >
            {loading ? 'Ingresando...' : <>Ingresar <ArrowRightIcon className="h-5 w-5 ml-2" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}