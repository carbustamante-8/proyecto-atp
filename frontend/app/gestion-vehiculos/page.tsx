'use client'; 
import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
  // (Toda la lógica de 'useState' y 'useEffect' queda idéntica)
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
  
  // (La lógica de 'handleConfirmarEliminar' no cambia)
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
    return <div className="p-8 text-gray-900">Validando sesión y cargando vehículos...</div>;
  }

  return (
    <Fragment>
      {/* --- ¡MODAL REFACTORIZADO! --- */}
      {/* Ahora usa las clases globales .modal-overlay y .modal-content 
          definidas en globals.css para consistencia. */}
      {modalAbierto && vehiculoParaEliminar && (
        <div className="modal-overlay"> {/* Usa clase global */}
          <div className="absolute inset-0" onClick={handleCerrarModal}></div>
          <div className="modal-content"> {/* Usa clase global */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que quieres eliminar el vehículo patente 
              {/* Color de acento de la marca */}
              <strong className="text-pepsi-blue"> {vehiculoParaEliminar.patente}</strong> ({vehiculoParaEliminar.modelo})?
            </p>
            <div className="flex justify-end space-x-4">
              <button onClick={handleCerrarModal} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium">
                Cancelar
              </button>
              {/* Botón de peligro usa el color pepsi-red */}
              <button 
                onClick={handleConfirmarEliminar} 
                className="px-4 py-2 rounded-md text-white bg-pepsi-red hover:bg-red-700 font-medium"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ¡PÁGINA REFACTORIZADA! --- */}
      {/* Mantiene el padding pero el contenido principal va en la "tarjeta" */}
      <div className="p-8 text-gray-900">
        <div className="flex justify-between items-center mb-6">
          
          {/* Título usa el color pepsi-blue */}
          <h1 className="text-3xl font-bold text-pepsi-blue">Gestión de Vehículos</h1>
          
          {/* Botón principal usa el color pepsi-blue */}
          <Link href="/gestion-vehiculos/crear">
            <span className="bg-pepsi-blue text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-blue-700 transition-colors">
              + Registrar Vehículo
            </span>
          </Link>
        </div>
        
        {/* La tarjeta blanca de la tabla ya estaba bien estilizada, la mantenemos */}
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca/Modelo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Año</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VIN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{v.vin || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{v.color || 'N/A'}</td>
                  
                  {/* (Celda de estado no cambia) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      v.estado === 'Operativo' ? 'bg-green-100 text-green-800' : 
                      v.estado === 'En Taller' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {v.estado}
                    </span>
                  </td>
                  
                  {/* Acciones de la tabla usan los colores de la marca */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <Link href={`/gestion-vehiculos/editar-vehiculo/${v.id}`}>
                      <span className="text-pepsi-blue hover:text-blue-700 font-medium cursor-pointer">Editar</span>
                    </Link>
                    <button 
                      onClick={() => handleAbrirModal(v)} 
                      className="text-pepsi-red hover:text-red-700 font-medium"
                    >
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