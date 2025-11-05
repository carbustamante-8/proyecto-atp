// app/crear-ot/page.tsx

'use client'; // <-- Obligatorio, es un formulario interactivo

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Para redirigir

export default function CrearOTPage() {
  
  // 1. Estados para guardar los datos del formulario
  const [patente, setPatente] = useState('');
  const [descripcionProblema, setDescripcionProblema] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Hook para redirigir

  // 2. Función que se ejecuta al enviar el formulario
  const handleCrearOT = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue
    
    if (!patente || !descripcionProblema) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 3. ¡AQUÍ ESTÁ LA MAGIA! Llama a tu API de OTs con POST
      const response = await fetch('/api/ordenes-trabajo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Envía los datos de los estados en el "body"
        body: JSON.stringify({
          patente,
          descripcionProblema,
          // (La API pondrá el estado "Pendiente" automáticamente)
        }),
      });

      if (!response.ok) {
        throw new Error('Falló la creación de la OT');
      }

      // 4. ¡Éxito!
      console.log('OT creada exitosamente');
      
      // 5. Redirige al usuario de vuelta al tablero del mecánico
      router.push('/mis-tareas');

    } catch (err) {
      console.error(err);
      if (err instanceof Error) setError(err.message);
      else setError('Un error desconocido ocurrió');
    } finally {
      setLoading(false); // Deja de mostrar "Cargando..."
    }
  };

  // 6. JSX del formulario (inspirado en tu vista de Control de Acceso)
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Registrar Nueva Orden de Trabajo
        </h1>

        <form onSubmit={handleCrearOT} className="space-y-6">
          
          {/* Campo Patente */}
          <div>
            <label htmlFor="patente" className="block text-sm font-medium text-gray-700">
              Patente del Vehículo
            </label>
            <input
              type="text"
              id="patente"
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
              placeholder="Ej: AB123CD"
            />
          </div>

          {/* Campo Descripción del Problema */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
              Descripción del Problema
            </label>
            <textarea
              id="descripcion"
              value={descripcionProblema}
              onChange={(e) => setDescripcionProblema(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
              placeholder="Ej: Ruido inusual en el motor al acelerar..."
            />
          </div>

          {/* Mensaje de Error */}
          {error && (
            <p className="text-red-500 text-center">{error}</p>
          )}

          {/* Botón de Crear */}
          <button
            type="submit"
            disabled={loading} // Deshabilita el botón mientras carga
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Guardando...' : 'Crear OT'}
          </button>
        </form>
      </div>
    </div>
  );
}