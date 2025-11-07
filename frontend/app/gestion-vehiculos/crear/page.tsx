// app/gestion-vehiculos/crear/page.tsx

'use client'; // <-- Obligatorio, es un formulario interactivo

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Para redirigir

// (Este tipo es para el 'id_chofer_asignado', lo cargaremos desde la BD)
type UsuarioSimple = {
  id: string;
  nombre: string;
};

export default function CrearVehiculoPage() {
  
  // 1. Estados para guardar los datos del formulario (basado en tu API)
  const [patente, setPatente] = useState('');
  const [modelo, setModelo] = useState('');
  const [año, setAño] = useState(''); // Lo guardamos como string, la API lo convertirá
  const [tipo_vehiculo, setTipoVehiculo] = useState(''); // Ej: Diésel, Eléctrico
  const [kilometraje, setKilometraje] = useState('');
  const [id_chofer_asignado, setChoferAsignado] = useState(''); // El ID del chofer
  
  const [choferes, setChoferes] = useState<UsuarioSimple[]>([]); // Para el <select>
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 2. Hook para cargar la lista de choferes (¡para el <select>!)
  useEffect(() => {
    const fetchChoferes = async () => {
      try {
        // Llama a la API de usuarios que ya creamos
        const response = await fetch('/api/usuarios');
        const usuarios = await response.json();
        
        // Filtra solo los usuarios que tienen el rol "Conductor"
        const listaChoferes = usuarios.filter((u: any) => u.rol === 'Conductor');
        setChoferes(listaChoferes);
        
      } catch (err) {
        console.error("Error cargando choferes:", err);
        setError('No se pudo cargar la lista de choferes.');
      }
    };
    fetchChoferes();
  }, []); // Se ejecuta 1 vez al cargar

  // 3. Función que se ejecuta al enviar el formulario
  const handleCrearVehiculo = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    if (!patente || !modelo || !tipo_vehiculo) {
      setError('Patente, Modelo y Tipo son obligatorios.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 4. ¡AQUÍ ESTÁ LA MAGIA! Llama a tu API de vehículos con POST
      const response = await fetch('/api/vehiculos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patente,
          modelo,
          año: parseInt(año) || null, // Convierte a número
          tipo_vehiculo,
          kilometraje: parseInt(kilometraje) || 0,
          id_chofer_asignado: id_chofer_asignado || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Falló la creación del vehículo');
      }

      // 5. ¡Éxito!
      console.log('Vehículo creado exitosamente');
      router.push('/gestion-vehiculos'); // Redirige de vuelta a la tabla

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
          Añadir Nuevo Vehículo a la Flota
        </h1>

        <form onSubmit={handleCrearVehiculo} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            {/* Campo Patente */}
            <div>
              <label htmlFor="patente" className="block text-sm font-medium text-gray-700">
                Patente
              </label>
              <input
                type="text" id="patente" value={patente}
                onChange={(e) => setPatente(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
                placeholder="Ej: AB12CD"
              />
            </div>
            {/* Campo Modelo */}
            <div>
              <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">
                Modelo
              </label>
              <input
                type="text" id="modelo" value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
                placeholder="Ej: Boxer, Porter, RAM"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Campo Año */}
            <div>
              <label htmlFor="año" className="block text-sm font-medium text-gray-700">
                Año
              </label>
              <input
                type="number" id="año" value={año}
                onChange={(e) => setAño(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
                placeholder="Ej: 2021"
              />
            </div>
            {/* Campo Kilometraje */}
            <div>
              <label htmlFor="kilometraje" className="block text-sm font-medium text-gray-700">
                Kilometraje
              </label>
              <input
                type="number" id="kilometraje" value={kilometraje}
                onChange={(e) => setKilometraje(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
                placeholder="Ej: 150000"
              />
            </div>
          </div>
          
          {/* Campo Tipo de Vehículo */}
          <div>
            <label htmlFor="tipo_vehiculo" className="block text-sm font-medium text-gray-700">
              Tipo de Vehículo
            </label>
            <select
              id="tipo_vehiculo" value={tipo_vehiculo}
              onChange={(e) => setTipoVehiculo(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            >
              <option value="" disabled>Selecciona un tipo</option>
              {/* Basado en datos del cliente */}
              <option value="Eléctrico">Eléctrico</option>
              <option value="Diésel">Diésel</option>
              <option value="Ventas">Vehículo de Ventas</option>
              <option value="Respaldo">Flota de Respaldo</option>
            </select>
          </div>

          {/* Campo Chofer Asignado (¡Carga datos de la API de usuarios!) */}
          <div>
            <label htmlFor="id_chofer_asignado" className="block text-sm font-medium text-gray-700">
              Chofer Asignado (Opcional)
            </label>
            <select
              id="id_chofer_asignado" value={id_chofer_asignado}
              onChange={(e) => setChoferAsignado(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            >
              <option value="">Sin chofer fijo</option>
              {/* Se rellena con los datos de la API /api/usuarios */}
              {choferes.map(chofer => (
                <option key={chofer.id} value={chofer.id}>{chofer.nombre}</option>
              ))}
            </select>
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
            {loading ? 'Guardando...' : 'Añadir Vehículo'}
          </button>
        </form>
      </div>
    </div>
  );
}