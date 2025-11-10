// frontend/app/page.tsx
'use client'; 
import React, { useState, useEffect } from 'react'; 
import Image from 'next/image'; 
import Link from 'next/link'; 
import { auth } from '@/lib/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; // <-- 1. Importar toast

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [error, setError] = useState(''); // <-- 2. Ya no lo usamos
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    // ... (lógica de redirección no cambia) ...
    if (!authLoading && user && userProfile) {
      if (['Jefe de Taller', 'Supervisor', 'Coordinador', 'Gerente'].includes(userProfile.rol)) {
        router.push('/dashboard-admin');
      } else if (userProfile.rol === 'Mecánico') {
        router.push('/mis-tareas');
      } else if (userProfile.rol === 'Guardia') {
        router.push('/control-acceso');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // El 'useEffect' se encargará de redirigir
    } catch (err) {
      console.error('Error en el login:', err);
      toast.error('Error: Correo o contraseña incorrectos.'); // <-- 3. Cambiado
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-100 text-gray-900">
        Validando sesión...
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
        <div className="flex justify-center mb-6">
          <Image
            src="/pepsico-logo.png" 
            alt="PepsiCo Logo"
            width={150} 
            height={150}
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900">Pepsi-Fleet</h1>
        <p className="text-center text-gray-600 mb-6">Por favor, ingresa tus datos</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
            <input
              type="email" id="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña:</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 px-3 py-2 text-sm text-gray-600"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>
          <div className="text-right text-sm">
            <Link href="/recuperar-contrasena">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                ¿Olvidaste tu contraseña?
              </span>
            </Link>
          </div>
          {/* El error ahora es un Toast */}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </main>
  );
}