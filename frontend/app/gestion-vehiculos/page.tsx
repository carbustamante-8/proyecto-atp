// frontend/app/gestion-vehiculos/page.tsx
'use client'; 
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

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
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchVehiculos();
        } else {
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchVehiculos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vehiculos');
      if (!response.ok) throw new Error('No se pudieron cargar los vehículos');
      const data = await response.json();
      setVehiculos(data); 
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false); 
    }
  };

  const handleEliminar = async (vehiculoId: string, patente: string) => {
    if (!confirm(`¿Seguro que quieres eliminar la patente "${patente}"?`)) return;
    try {
      const response = await fetch(`/api/vehiculos?id=${vehiculoId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar el vehículo');
      setVehiculos(v => v.filter(v => v.id !== vehiculoId));
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    }
  };
  
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  if (!['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol)) {
     return <div className="p-8 text-gray-900">Acceso denegado.</div>;
  }

  return (
    <div className="p-8 text-gray-900"> 
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Flota (Vehículos)</h1>
        <Link href="/gestion-vehiculos/crear"> 
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-blue-700">
            + Añadir Nuevo Vehículo
          </button>
        </Link>
      </div>
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
              <tr><td colSpan={6} className="px-6 py-4 text-center">Cargando vehículos...</td></tr>
            )}
            {error && (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-red-500">{error}</td></tr>
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
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {vehiculo.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <Link href={`/gestion-vehiculos/editar-vehiculo/${vehiculo.id}`}>
                      <button className="text-blue-600 hover:text-blue-900">Editar</button>
                    </Link>
                    <button onClick={() => handleEliminar(vehiculo.id, vehiculo.patente)} className="text-red-600 hover:text-red-900 ml-4">Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              !loading && !error && vehiculos.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-4 text-center">No se encontraron vehículos en la flota.</td></tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}