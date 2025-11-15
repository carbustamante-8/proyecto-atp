// frontend/app/gestion-vehiculos/editar-vehiculo/[id]/page.tsx
// (CÓDIGO CORREGIDO: Solucionado el error "uncontrolled input")

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

// ¡Definimos el tipo con valores NO NULOS!
type VehiculoData = {
  patente: string;
  marca: string;
  modelo: string;
  año: number | string; // Permitimos string para el input
  tipo_vehiculo: string;
  estado: string;
  id_chofer_asignado: string; // Usamos string vacío en lugar de null
};

function EditarVehiculoForm() {
  
  // --- ¡ESTADO INICIAL CORREGIDO! ---
  // Inicializamos con valores por defecto (strings vacíos)
  // para que los inputs sean "controlados" desde el inicio.
  const [vehiculoData, setVehiculoData] = useState<VehiculoData>({
    patente: '',
    marca: '',
    modelo: '',
    año: '', // Empezar como string vacío
    tipo_vehiculo: 'Camión',
    estado: 'Operativo',
    id_chofer_asignado: '',
  });
  
  const [conductores, setConductores] = useState<User[]>([]);
  
  // 'loadingSubmit' es para el botón, 'loadingPage' es para cargar datos
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true); // ¡Importante!
  
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        // --- ¡ROLES CORREGIDOS! (quitamos Jefe de Taller) ---
        const rolesPermitidos = ['Supervisor', 'Coordinador'];
        if (!rolesPermitidos.includes(userProfile.rol)) {
          toast.error('No tienes permiso para acceder a esta página.');
          router.push('/');
        } else {
          // Carga ambos, conductores y datos del vehículo
          fetchConductores();
          fetchVehiculoData();
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router, id]); // 'id' debe estar aquí

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
    setLoadingPage(true);
    try {
      const response = await fetch(`/api/vehiculos/${id}`);
      if (!response.ok) throw new Error('Vehículo no encontrado');
      const data = await response.json();
      
      // --- ¡CORRECCIÓN! ---
      // Aseguramos que 'id_chofer_asignado' y 'año' nunca sean 'null' o 'NaN'
      setVehiculoData({
        ...data,
        año: data.año || '', // Convertir null/NaN/undefined a string vacío
        id_chofer_asignado: data.id_chofer_asignado || '',
      });
      
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      router.push('/gestion-vehiculos');
    } finally {
      setLoadingPage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- ¡NUEVA VALIDACIÓN! ---
    const añoNum = parseInt(vehiculoData.año as string, 10);
    if (isNaN(añoNum)) {
      toast.error('El año debe ser un número válido.');
      return;
    }
    
    setLoadingSubmit(true);
    const toastId = toast.loading('Actualizando vehículo...');
    try {
      const response = await fetch(`/api/vehiculos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vehiculoData,
          año: añoNum, // Enviar como número
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
      setLoadingSubmit(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setVehiculoData(prev => ({ ...prev, [id]: value })); 
  };

  // --- ¡PANTALLA DE CARGA CORREGIDA! ---
  if (authLoading || loadingPage) {
    return <div className="p-8 text-gray-900">Cargando...</div>;
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
          
          {/* (Año - ¡ACTUALIZADO!) */}
          <div>
            <label htmlFor="año" className="block text-sm font-medium text-gray-700">Año</label>
            <input 
              type="number" // El input sigue siendo 'number' para el teclado móvil
              id="año" 
              value={vehiculoData.año} // El valor ahora es un string o número
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50" 
            />
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
          
          {/* (Conductor Asignado - ¡ACTUALIZADO!) */}
          <div>
            <label htmlFor="id_chofer_asignado" className="block text-sm font-medium text-gray-700">Conductor Asignado</label>
            <select id="id_chofer_asignado" value={vehiculoData.id_chofer_asignado} onChange={handleChange}
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
          
          {/* (Botones - sin cambios) */}
          <div className="space-y-4 pt-4">
            <button
              type="submit"
              disabled={loadingSubmit}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loadingSubmit ? 'Actualizando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/gestion-vehiculos')}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>

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