'use client'; 
import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

// --- ¡NUEVO! Iconos para la UI ---
import { 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';

// (El tipo Vehiculo no cambia)
type Vehiculo = {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  tipo_vehiculo: string;
  estado: string;
  id_chofer_asignado: string | null;
  color?: string;
  vin?: string;
  n_motor?: string;
};

export default function GestionVehiculosPage() {
  
  // (Toda la lógica de 'useState', 'useEffect' y 'fetch' queda idéntica)
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [vehiculoParaEliminar, setVehiculoParaEliminar] = useState<Vehiculo | null>(null);

  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
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
    const idVehiculo = vehiculoParaEliminar.id;
    setModalAbierto(false); 
    const promise = fetch(`/api/vehiculos/${idVehiculo}`, { method: 'DELETE' });
    toast.promise(promise, {
      loading: 'Eliminando vehículo...',
      success: (res) => {
        if (!res.ok) throw new Error('Error de servidor al eliminar');
        setVehiculos(vehiculos.filter(v => v.id !== idVehiculo));
        setVehiculoParaEliminar(null);
        return 'Vehículo eliminado permanentemente.';
      },
      error: (err) => {
        setVehiculoParaEliminar(null);
        return err.message || 'Error al eliminar el vehículo';
      }
    });
  };

  if (authLoading || loading) {
    return <div className="p-8 font-sans">Validando sesión y cargando vehículos...</div>;
  }

  // --- JSX REFACTORIZADO VISUALMENTE ---
  return (
    <Fragment>
      {/* --- Modal de Confirmación (Rediseñado) --- */}
      {/* Usamos las clases globales .modal-overlay y .modal-content */}
      {modalAbierto && vehiculoParaEliminar && (
        <div className="modal-overlay" onClick={handleCerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Confirmar Eliminación</h2>
            <p className="text-neutral-700 mb-6">
              ¿Estás seguro de que quieres eliminar el vehículo patente 
              <strong className="text-pepsi-blue"> {vehiculoParaEliminar.patente}</strong> ({vehiculoParaEliminar.modelo})? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-4">
              {/* Botón Cancelar (neutral) */}
              <button 
                onClick={handleCerrarModal} 
                className="px-4 py-2 rounded-md text-neutral-900 bg-neutral-100 hover:bg-neutral-200 font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              {/* Botón de peligro usa el color pepsi-red */}
              <button 
                onClick={handleConfirmarEliminar} 
                className="px-4 py-2 rounded-md text-white bg-pepsi-red hover:bg-pepsi-red-dark font-medium transition-colors duration-200"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Contenedor Principal de la Página --- */}
      <div className="p-8 font-sans">
        
        {/* Encabezado con Título y Botón de Acción */}
        <div className="flex justify-between items-center mb-6">
          {/* Título usa el color pepsi-blue */}
          <h1 className="text-3xl font-bold text-pepsi-blue">Gestión de Vehículos</h1>
          
          {/* Botón principal usa el color pepsi-blue */}
          <Link 
            href="/gestion-vehiculos/crear"
            className="inline-flex items-center gap-2 bg-pepsi-blue text-white px-5 py-2 rounded-lg shadow font-semibold 
                       hover:bg-pepsi-blue-dark transition-colors duration-200"
          >
            <PlusIcon className="h-5 w-5" />
            Registrar Vehículo
          </Link>
        </div>
        
        {/* Tarjeta blanca para la tabla */}
        <div className="bg-white shadow-card rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Header de la tabla (neutral) */}
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Marca/Modelo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Año</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">VIN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Color</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehiculos.map((v) => (
                <tr key={v.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-neutral-900">{v.patente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-700">{v.marca || 'N/A'} {v.modelo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-700">{v.año}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-700">{v.vin || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-700">{v.color || 'N/A'}</td>
                  
                  {/* (Celda de estado no cambia) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      v.estado === 'Operativo' ? 'bg-green-100 text-green-800' : 
                      v.estado === 'En Taller' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {v.estado}
                    </span>
                  </td>

                  {/* Acciones de la tabla con iconos y colores de la marca */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <Link 
                      href={`/gestion-vehiculos/editar-vehiculo/${v.id}`}
                      className="inline-flex items-center gap-1 text-pepsi-blue-light hover:text-pepsi-blue-dark font-medium transition-colors duration-200"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Editar
                    </Link>
                    <button 
                      onClick={() => handleAbrirModal(v)} 
                      className="inline-flex items-center gap-1 text-pepsi-red hover:text-pepsi-red-dark font-medium transition-colors duration-200"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Fragment>
  );
}