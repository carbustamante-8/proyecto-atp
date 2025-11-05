// app/gestion-repuestos/crear/page.tsx

'use client'; // <-- Obligatorio, es un formulario interactivo

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Para redirigir

export default function CrearRepuestoPage() {
  
  // 1. Estados para guardar los datos del formulario (basado en tu maqueta)
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Hook para redirigir

  // 2. Función que se ejecuta al enviar el formulario
  const handleCrearRepuesto = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue
    
    if (!codigo || !nombre) {
      setError('El Código y el Nombre son obligatorios.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 3. ¡AQUÍ ESTÁ LA MAGIA! Llama a tu API de repuestos con POST
      const response = await fetch('/api/repuestos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Envía los datos de los estados en el "body"
        body: JSON.stringify({
          codigo,
          nombre,
          marca,
          descripcion,
        }),
      });

      if (!response.ok) {
        throw new Error('Falló la creación del repuesto');
      }

      // 4. ¡Éxito!
      console.log('Repuesto creado exitosamente');
      
      // 5. Redirige al usuario de vuelta a la tabla de repuestos
      router.push('/gestion-repuestos');

    } catch (err) {
      console.error(err);
      if (err instanceof Error) setError(err.message);
      else setError('Un error desconocido ocurrió');
    } finally {
      setLoading(false); // Deja de mostrar "Cargando..."
    }
  };

  // 6. JSX del formulario
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Añadir Nuevo Repuesto
        </h1>

        <form onSubmit={handleCrearRepuesto} className="space-y-6">
          
          {/* Campo Código (ej: RP001) */}
          <div>
            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">
              Código
            </label>
            <input
              type="text"
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
              placeholder="Ej: RP001"
            />
          </div>

          {/* Campo Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre del Repuesto
            </label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
              placeholder="Ej: Filtro de Aceite"
            />
          </div>

          {/* Campo Marca */}
          <div>
            <label htmlFor="marca" className="block text-sm font-medium text-gray-700">
              Marca
            </label>
            <input
              type="text"
              id="marca"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
              placeholder="Ej: AutoParts"
            />
          </div>

          {/* Campo Descripción */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
              placeholder="Ej: Filtro de aceite para motor..."
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
            {loading ? 'Guardando...' : 'Añadir Repuesto'}
          </button>
        </form>
      </div>
    </div>
  );
}