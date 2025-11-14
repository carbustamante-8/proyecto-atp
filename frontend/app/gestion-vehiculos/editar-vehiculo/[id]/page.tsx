// frontend/app/gestion-vehiculos/editar-vehiculo/[id]/page.tsx
// (CÓDIGO ACTUALIZADO: Añadido botón "Cancelar")

'use client'; 

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type User = {
  id: string;
  nombre: string;
  rol: string;
};

type VehiculoData = {
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  tipo_vehiculo: string;
  estado: string;
  id_chofer_asignado: string | null;
};

function EditarVehiculoForm() {
  const [vehiculoData, setVehiculoData] = useState<VehiculoData | null>(null);
  const [conductores, setConductores] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (!rolesPermitidos.includes(userProfile.rol)) {
          toast.error('No tienes permiso para acceder a esta página.');
          router.push('/');
        } else {
          fetchConductores();
          fetchVehiculoData();
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router, id]); // Añadido 'id'

  const fetchConductores = async () => {
    try {
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('No se pudo cargar la lista de conductores');
      const usuarios: User[] = await response.json();
      setConductores(usuarios.filter(u => u.rol === 'Conductor'));
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  const fetchVehiculoData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/vehiculos/${id}`);
      if (!response.ok) throw new Error('Vehículo no encontrado');
      const data = await response.json();
      setVehiculoData(data);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      router.push('/gestion-vehiculos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiculoData) return;
    setLoading(true);
    const toastId = toast.loading('Actualizando vehículo...');
    try {
      const response = await fetch(`/api/vehiculos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vehiculoData,
          año: Number(vehiculoData.año), 
          id_chofer_asignado: vehiculoData.id_chofer_asignado || null
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el vehículo');
      }
      toast.success('¡Vehículo actualizado exitosamente!', { id: toastId });
      router.push('/gestion-vehiculos');
    } catch (error) {
      if (error instanceof Error) toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setVehiculoData(prev => prev ? { ...prev, [id]: value } : null);
  };

  if (authLoading || !userProfile || !vehiculoData) {
    return <div className="p-8 text-gray-900">Cargando...</div>;
  }
  if (!userProfile || !['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol)) {
    return <div className="p-8 text-gray-900">Acceso denegado.</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Editar Vehículo
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="patente" className="block text-sm font-medium text-gray-700">Patente (No editable)</label>
            <input type="text" id="patente" value={vehiculoData.patente} disabled
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-500 bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="marca" className="block text-sm font-medium text-gray-700">Marca</label>
              <input type="text" id="marca" value={vehiculoData.marca} onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
            </div>
            <div>
              <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">Modelo</label>
              <input type="text" id="modelo" value={vehiculoData.modelo} onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
            </div>
          </div>
          <div>
            <label htmlFor="año" className="block text-sm font-medium text-gray-700">Año</label>
            <input type="number" id="año" value={vehiculoData.año} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
          </div>
          <div>
            <label htmlFor="tipo_vehiculo" className="block text-sm font-medium text-gray-700">Tipo de Vehículo</label>
            <select id="tipo_vehiculo" value={vehiculoData.tipo_vehiculo} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50">
              <option value="Camión">Camión</option>
              <option value="Camioneta">Camioneta</option>
              <option value="Auto">Auto</option>
              <option value="Grúa Horquilla">Grúa Horquilla</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label htmlFor="id_chofer_asignado" className="block text-sm font-medium text-gray-700">Conductor Asignado</label>
            <select id="id_chofer_asignado" value={vehiculoData.id_chofer_asignado || ''} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50">
              <option value="">Ninguno</option>
              {conductores.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
            <select id="estado" value={vehiculoData.estado} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50">
              <option value="Operativo">Operativo</option>
              <option value="En Taller">En Taller</option>
              <option value="De Baja">De Baja</option>
            </select>
          </div>
          
          {/* --- ¡BLOQUE DE BOTONES ACTUALIZADO! --- */}
          <div className="space-y-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Actualizando...' : 'Guardar Cambios'}
            </button>

            {/* --- ¡NUEVO BOTÓN DE CANCELAR! --- */}
            <button
              type="button"
              onClick={() => router.push('/gestion-vehiculos')} // Vuelve a la lista
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
          {/* --- FIN DEL BLOQUE --- */}

        </form>
      </div>
    </div>
  );
}

export default function EditarVehiculoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-900">Cargando...</div>}>
      <EditarVehiculoForm />
    </Suspense>
  );
}