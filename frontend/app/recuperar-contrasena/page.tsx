// frontend/app/recuperar-contrasena/page.tsx

'use client'; 

import { useState } from 'react';
import Link from 'next/link'; 
import { auth } from '@/lib/firebase'; 
import { sendPasswordResetEmail } from 'firebase/auth'; 

export default function RecuperarContrasenaPage() {
  
  // 1. Estados para el formulario
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); 
  const [loading, setLoading] = useState(false);

  // 2. Función que se ejecuta al enviar el formulario
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // 3. Llama a la función de Firebase
      await sendPasswordResetEmail(auth, email);

      // 4. ¡Éxito!
      setSuccess(true);
      setEmail(''); 
      
    } catch (err) {
      
      // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
      // Hacemos la validación de tipo segura que aprendimos
      
      console.error("Error en reseteo de clave:", err);
      if (err && typeof err === 'object' && 'code' in err) {
        if (err.code === 'auth/user-not-found') {
          setError('No se encontró ningún usuario con ese correo electrónico.');
        } else {
          setError('Error al enviar el correo. Intenta de nuevo.');
        }
      } else if (err instanceof Error) {
         setError(err.message);
      } else {
         setError('Un error desconocido ocurrió.');
      }
      // --- FIN DE LA CORRECCIÓN ---

    } finally {
      setLoading(false); 
    }
  };

  // 6. JSX del formulario (sin cambios)
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
          
          {/* Campo Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
              placeholder="tu-email@ejemplo.com"
            />
          </div>

          {/* Mensaje de Error */}
          {error && (
            <p className="text-red-500 text-center">{error}</p>
          )}

          {/* Mensaje de Éxito */}
          {success && (
            <p className="text-green-600 text-center">
              ¡Correo enviado! Revisa tu bandeja de entrada (y spam) para ver las instrucciones.
            </p>
          )}

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={loading} 
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Enviando...' : 'Enviar Instrucciones'}
          </button>

          {/* Enlace de vuelta al Login */}
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