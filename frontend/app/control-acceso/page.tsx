// app/control-acceso/page.tsx

'use client'; // <-- Obligatorio, es un formulario interactivo

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Para redirigir

export default function ControlAccesoPage() {
  
  // 1. Estados para guardar los datos del formulario (basado en Punto 7 del cliente)
  const [patente, setPatente] = useState('');
  const [chofer, setChofer] = useState('');
  const [motivoIngreso, setMotivoIngreso] = useState('');
  const [kilometraje, setKilometraje] = useState('');
  const [zonaOrigen, setZonaOrigen] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // Para mostrar mensaje de éxito
  const router = useRouter(); // Hook para redirigir

  // 2. Función que se ejecuta al enviar el formulario
  const handleRegistrarIngreso = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue
    
    if (!patente || !chofer || !motivoIngreso || !kilometraje || !zonaOrigen) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // 3. ¡AQUÍ ESTÁ LA MAGIA! Llama a tu API de registros con POST
      const response = await fetch('/api/registros-acceso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Envía los datos de los estados en el "body"
        body: JSON.stringify({
          patente,
          chofer,
          motivoIngreso,
          kilometraje,
          zonaOrigen,
        }),
      });

      if (!response.ok) {
        throw new Error('Falló el registro del ingreso');
      }

      // 4. ¡Éxito!
      console.log('Ingreso registrado exitosamente');
      setSuccess(true); // Muestra mensaje de éxito
      
      // Limpia el formulario
      setPatente('');
      setChofer('');
      setMotivoIngreso('');
      setKilometraje('');
      setZonaOrigen('');

      // Opcional: Redirigir después de unos segundos
      // setTimeout(() => router.push('/dashboard-guardia'), 2000);

    } catch (err) {
      console.error(err);
      if (err instanceof Error) setError(err.message);
      else setError('Un error desconocido ocurrió');
    } finally {
      setLoading(false); // Deja de mostrar "Cargando..."
    }
  };

  // 6. JSX del formulario (Estilo de tu maqueta, campos del Punto 7)
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Control de Acceso Vehicular
        </h1>
        <p className="text-center text-gray-500 mb-6">Rol: Guardia de Seguridad</p>

        <form onSubmit={handleRegistrarIngreso} className="space-y-4">
          
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

          {/* Campo Chofer */}
          <div>
            <label htmlFor="chofer" className="block text-sm font-medium text-gray-700">
              Nombre del Chofer
            </label>
            <input
              type="text"
              id="chofer"
              value={chofer}
              onChange={(e) => setChofer(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          {/* Campo Kilometraje */}
          <div>
            <label htmlFor="kilometraje" className="block text-sm font-medium text-gray-700">
              Kilometraje
            </label>
            <input
              type="number"
              id="kilometraje"
              value={kilometraje}
              onChange={(e) => setKilometraje(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
              placeholder="Ej: 150000"
            />
          </div>

          {/* Campo Zona de Origen */}
          <div>
            <label htmlFor="zonaOrigen" className="block text-sm font-medium text-gray-700">
              Zona de Origen
            </label>
            <input
              type="text"
              id="zonaOrigen"
              value={zonaOrigen}
              onChange={(e) => setZonaOrigen(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
              placeholder="Ej: Antofagasta"
            />
          </div>

          {/* Campo Motivo de Ingreso */}
          <div>
            <label htmlFor="motivoIngreso" className="block text-sm font-medium text-gray-700">
              Motivo de Ingreso
            </label>
            <textarea
              id="motivoIngreso"
              value={motivoIngreso}
              onChange={(e) => setMotivoIngreso(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
              placeholder="Ej: Mantención preventiva, falla en motor..."
            />
          </div>

          {/* Mensaje de Error */}
          {error && (
            <p className="text-red-500 text-center">{error}</p>
          )}

          {/* Mensaje de Éxito */}
          {success && (
            <p className="text-green-500 text-center">¡Ingreso registrado exitosamente!</p>
          )}

          {/* Botón de Registrar */}
          <button
            type="submit"
            disabled={loading} // Deshabilita el botón mientras carga
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Registrando...' : 'Registrar Ingreso'}
          </button>
        </form>
      </div>
    </div>
  );
}