// app/gestion-vehiculos/page.tsx

'use client'; // <-- Obligatorio, porque vamos a pedir datos

import { useState, useEffect } from 'react';
import Link from 'next/link'; // Para el botón de "Añadir Nuevo Vehículo"

// 1. Define un "tipo" para tus Vehículos (basado en tu API)
type Vehiculo = {
  id: string;
  patente: string;
  modelo: string;
  año: number;
  tipo_vehiculo: string;
  kilometraje: number;
  estado: string;
};

export default function GestionVehiculosPage() {
  
  // 2. Crea "estados" para guardar la lista y la carga
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- ¡AÑADE ESTA NUEVA FUNCIÓN! ---
  const handleEliminar = async (vehiculoId: string, patente: string) => {
    // 1. Pide confirmación antes de borrar
    if (!confirm(`¿Estás seguro de que quieres eliminar el vehículo patente "${patente}"? Esta acción no se puede deshacer.`)) {
      return; // Si el usuario cancela, no hace nada
    }

    try {
      // 2. Llama a tu API usando el método DELETE y pasando el ID
      const response = await fetch(`/api/vehiculos?id=${vehiculoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el vehículo');
      }

      // 3. ¡Éxito! Ahora actualiza la lista en la pantalla
      // Filtra la lista actual, quitando el vehículo que acabamos de borrar
      setVehiculos(vehiculosActuales => 
        vehiculosActuales.filter(v => v.id !== vehiculoId)
      );
      console.log('Vehículo eliminado:', vehiculoId);

    } catch (err) {
      console.error(err);
      if (err instanceof Error) setError(err.message);
      else setError('Un error desconocido ocurrió al eliminar');
    }
  };

  // 3. Este "Hook" se ejecuta 1 vez cuando la página carga
  useEffect(() => {
    
    const fetchVehiculos = async () => {
      try {
        setLoading(true);
        setError('');
        
        // 4. ¡AQUÍ ESTÁ LA MAGIA! Llama a la API GET de vehículos
        const response = await fetch('/api/vehiculos');
        
        if (!response.ok) {
          throw new Error('No se pudieron cargar los vehículos');
        }
        
        const data = await response.json();
        setVehiculos(data); // Guarda la lista en el estado
        
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('Un error desconocido ocurrió');
      } finally {
        setLoading(false); // Deja de cargar
      }
    };

    fetchVehiculos(); // Llama a la función al cargar la página
  }, []); // El array vacío `[]` significa "ejecutar solo 1 vez"


  // 5. MUESTRA LOS DATOS
  return (
    <div className="p-8 text-gray-900"> {/* Contenedor principal */}
      
      {/* Cabecera: Título y Botón */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Flota (Vehículos)</h1>
        
        {/* Este botón te llevará a la página para crear vehículos */}
        <Link href="/gestion-vehiculos/crear"> 
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-blue-700">
            + Añadir Nuevo Vehículo
          </button>
        </Link>
      </div>

      {/* Tabla de Vehículos */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kilometraje</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">Cargando vehículos...</td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-red-500">{error}</td>
              </tr>
            )}

            {!loading && !error && vehiculos.length > 0 ? (
              vehiculos.map(vehiculo => (
                <tr key={vehiculo.id}>
                  <td className="px-6 py-4 font-medium">{vehiculo.patente}</td>
                  <td className="px-6 py-4">{vehiculo.modelo}</td>
                  <td className="px-6 py-4">{vehiculo.tipo_vehiculo}</td>
                  <td className="px-6 py-4">{vehiculo.kilometraje.toLocaleString('es-CL')} km</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      vehiculo.estado === 'Activo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800' // (ej: 'En Taller')
                    }`}>
                      {vehiculo.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <Link href={`/gestion-vehiculos/editar-vehiculo/${vehiculo.id}`}>
                      <button className="text-blue-600 hover:text-blue-900">Editar</button>
                    </Link>
                    <button
                      onClick={() => handleEliminar(vehiculo.id, vehiculo.patente)}
                      className="text-red-600 hover:text-red-900 ml-4"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              !loading && !error && vehiculos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">No se encontraron vehículos en la flota.</td>
                </tr>
              )
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}