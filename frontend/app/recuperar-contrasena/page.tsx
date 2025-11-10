// frontend/app/recuperar-contrasena/page.tsx

'use client'; 
import { useState } from 'react';
import Link from 'next/link'; 
import { auth } from '@/lib/firebase'; 
import { sendPasswordResetEmail } from 'firebase/auth'; 
import toast from 'react-hot-toast'; // <-- 1. Importar toast

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  // const [error, setError] = useState(''); // <-- 2. Ya no lo usamos
  // const [success, setSuccess] = useState(false); // <-- 2. Ya no lo usamos
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!email) {
      toast.error('Por favor, ingresa tu correo electrónico.'); // <-- 3. Cambiado
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('¡Correo enviado! Revisa tu bandeja de entrada.'); // <-- 3. Cambiado
      setEmail(''); 
    } catch (err) {
      console.error(err);
      if (err && typeof err === 'object' && 'code' in err) {
        if (err.code === 'auth/user-not-found') {
          toast.error('No se encontró usuario con ese correo.'); // <-- 3. Cambiado
        } else {
          toast.error('Error al enviar el correo. Intenta de nuevo.'); // <-- 3. Cambiado
        }
      } else if (err instanceof Error) {
         toast.error(err.message); // <-- 3. Cambiado
      } else {
         toast.error('Un error desconocido ocurrió.'); // <-- 3. Cambiado
      }
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Recuperar Contraseña
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Ingresa tu correo electrónico para recibir las instrucciones.
        </p>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              type="email" id="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
              placeholder="tu-email@ejemplo.com"
            />
          </div>
          {/* Los mensajes de error/éxito ahora son Toasts */}
          <button
            type="submit"
            disabled={loading} 
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Enviando...' : 'Enviar Instrucciones'}
          </button>
          <div className="text-center">
            <Link href="/">
              <span className="text-sm text-blue-600 hover:underline">
                ¿Ya tienes una cuenta? Inicia sesión
              </span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}