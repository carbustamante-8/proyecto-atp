// frontend/app/gestion-vehiculos/page.tsx
'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Vehiculo = {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  tipo_vehiculo: string;
  estado: string;
  id_chofer_asignado: string | null;
};

export default function GestionVehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [vehiculoParaEliminar, setVehiculoParaEliminar] = useState<Vehiculo | null>(null);

  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        // --- ¡ROL CORREGIDO! ---
        const rolesPermitidos = ['Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchVehiculos();
        } else {
          toast.error('Acceso denegado');
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // (fetchVehiculos - sin cambios)
  const fetchVehiculos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vehiculos');
      if (!response.ok) throw new Error('No se pudo cargar la lista de vehículos');
      const data = await response.json();
      setVehiculos(data);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // (Funciones de Modal y Eliminar - sin cambios)
  const handleAbrirModal = (vehiculo: Vehiculo) => {
    setVehiculoParaEliminar(vehiculo);
    setModalAbierto(true);
  };
  const handleCerrarModal = () => {
    setVehiculoParaEliminar(null);
    setModalAbierto(false);
  };
  const handleConfirmarEliminar = async () => {
    if (!vehiculoParaEliminar) return;
    const toastId = toast.loading('Eliminando vehículo...');
    try {
      const response = await fetch(`/api/vehiculos/${vehiculoParaEliminar.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el vehículo');
      }
      toast.success('Vehículo eliminado permanentemente.', { id: toastId });
      setVehiculos(vehiculos.filter(v => v.id !== vehiculoParaEliminar.id));
    } catch (err) {
      if (err instanceof Error) toast.error(err.message, { id: toastId });
    } finally {
      handleCerrarModal();
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-gray-900">Validando sesión y cargando vehículos...</div>;
  }

  // (Renderizado JSX - sin cambios)
  return (
    <>
      {modalAbierto && vehiculoParaEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleCerrarModal}></div>
          <div className="relative z-10 bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que quieres eliminar el vehículo patente 
              <strong className="text-blue-600"> {vehiculoParaEliminar.patente}</strong> ({vehiculoParaEliminar.modelo})? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-4">
              <button onClick={handleCerrarModal} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium">
                Cancelar
              </button>
              <button onClick={handleConfirmarEliminar} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 font-medium">
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8 text-gray-900">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestión de Vehículos</h1>
          <Link href="/gestion-vehiculos/crear">
            <span className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-blue-700">
              + Registrar Vehículo
            </span>
          </Link>
        </div>
        
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca/Modelo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Año</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehiculos.map((v) => (
                <tr key={v.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{v.patente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{v.marca || 'N/A'} {v.modelo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{v.año}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{v.tipo_vehiculo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      v.estado === 'Operativo' ? 'bg-green-100 text-green-800' : 
                      v.estado === 'En Taller' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {v.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link href={`/gestion-vehiculos/editar-vehiculo/${v.id}`}>
                      <span className="text-blue-600 hover:text-blue-900 cursor-pointer">Editar</span>
                    </Link>
                    <button onClick={() => handleAbrirModal(v)} className="text-red-600 hover:text-red-900">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}