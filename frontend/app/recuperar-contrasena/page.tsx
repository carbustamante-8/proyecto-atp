// frontend/app/recuperar-contrasena/page.tsx
// (CÓDIGO ACTUALIZADO: Añadido botón "Volver al Login")

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // <-- ¡IMPORTACIÓN AÑADIDA!
import { auth, db } from '@/lib/firebase'; // <--- ESTO ES CORRECTO
import { sendPasswordResetEmail } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function RecuperarContrasenaPage() {
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
        router.push('/'); // Devuelve al login
        return '¡Correo enviado! Revisa tu bandeja de entrada.';
      },
      error: (err) => {
        setLoading(false);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
          return 'No se encontró ningún usuario con ese correo.';
        }
        return 'Error al enviar el correo. Intenta de nuevo.';
      }
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full bg-white p-10 rounded-lg shadow-2xl">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Recuperar Contraseña
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Ingresa tu correo electrónico y te enviaremos un enlace para reestablecer tu contraseña.
        </p>
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Enviando...' : 'Enviar Correo'}
            </button>
          </div>
          
          {/* --- ¡NUEVO BOTÓN DE VOLVER! --- */}
          <div className="text-center pt-4">
            <Link href="/">
              <span className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                ← Volver al Login
              </span>
            </Link>
          </div>
          {/* --- FIN DEL BOTÓN --- */}
          
        </form>
      </div>
    </div>
  );
}