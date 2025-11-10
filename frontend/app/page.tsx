// frontend/app/page.tsx
// (PÁGINA DE LOGIN - AHORA CON REDIRECCIÓN POR ROL)

'use client'; 

import React, { useState, useEffect } from 'react'; // ¡Importamos useEffect!
import Image from 'next/image'; 
import Link from 'next/link'; 
import { auth } from '@/lib/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // ¡IMPORTAMOS EL "CEREBRO"!

export default function Home() {
  
  // --- HOOKS ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // ¡Usamos el "Cerebro" para saber si ya hay alguien logueado!
  const { user, userProfile, loading: authLoading } = useAuth();

  // --- ¡NUEVA LÓGICA DE REDIRECCIÓN! ---
  useEffect(() => {
    // Si la autenticación NO está cargando Y SÍ hay un usuario/perfil...
    if (!authLoading && user && userProfile) {
      // ...¡no deberíamos estar en el login! Redirigimos al dashboard correcto.
      
      console.log(`Usuario ya logueado (${userProfile.rol}). Redirigiendo...`);
      
      if (userProfile.rol === 'Jefe de Taller' || userProfile.rol === 'Supervisor' || userProfile.rol === 'Coordinador') {
        router.push('/dashboard-admin');
      } else if (userProfile.rol === 'Mecánico') {
        router.push('/mis-tareas');
      } else if (userProfile.rol === 'Guardia') {
        router.push('/control-acceso');
      }
      // (Otros roles se quedan aquí por ahora, o podrías redirigirlos)
    }
  }, [user, userProfile, authLoading, router]);
  // --- FIN DE LA NUEVA LÓGICA ---


  // --- LÓGICA DE LOGIN (Simplificada) ---
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // ¡YA NO REDIRIGIMOS DESDE AQUÍ!
      // El 'useEffect' de arriba se dará cuenta del cambio
      // y hará la redirección por rol automáticamente.
      
    } catch (err) {
      console.error('Error en el login:', err);
      setError('Error: Correo o contraseña incorrectos.');
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // --- LÓGICA DE RENDERIZADO ---
  
  // Si está validando la sesión O si ya hay un usuario (y está a punto de redirigir),
  // muestra "Cargando..."
  if (authLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-100 text-gray-900">
        Validando sesión...
      </div>
    );
  }

  // Si NO hay usuario y NO está cargando, SÍ muestra el login
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-100">
      
      {/* La caja blanca del formulario */}
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/pepsico-logo.png" 
            alt="PepsiCo Logo"
            width={150} 
            height={150}
            priority
          />
        </div>

        {/* Títulos */}
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Pepsi-Fleet
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Por favor, ingresa tus datos
        </p>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
            <input
              type="email" id="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
            />
          </div>

          {/* Contraseña */}
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

          {/* Olvidé contraseña */}
          <div className="text-right text-sm">
            <Link href="/recuperar-contrasena">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                ¿Olvidaste tu contraseña?
              </span>
            </Link>
          </div>

          {error && <p className="text-red-500 text-center text-sm">{error}</p>}

          {/* Botón de login */}
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