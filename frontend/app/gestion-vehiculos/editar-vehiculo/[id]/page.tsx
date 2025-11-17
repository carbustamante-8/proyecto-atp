// frontend/app/gestion-vehiculos/editar-vehiculo/[id]/page.tsx
// (CÓDIGO VISUALMENTE REFACTORIZADO Y LÓGICA CORREGIDA)

'use client'; 

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link'; // Importamos Link para el botón Cancelar

type User = {
  id: string;
  nombre: string;
  rol: string;
};

type VehiculoData = {
  patente: string;
  marca: string;
  modelo: string;
  año: number | string;
  tipo_vehiculo: string;
  estado: string;
  id_chofer_asignado: string;
  color: string;
  vin: string;
  n_motor: string;
  n_chasis: string;
  pais_manufactura: string;
  tipo_combustible: string;
};

// --- ¡ESTILOS ESTÁNDAR PARA INPUTS! ---
const inputStyle = "w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50 focus:ring-pepsi-blue focus:border-pepsi-blue";
const disabledInputStyle = "w-full px-4 py-3 border border-gray-300 rounded-md text-gray-500 bg-gray-200 cursor-not-allowed";

function EditarVehiculoForm() {
  
  const [vehiculoData, setVehiculoData] = useState<VehiculoData>({
    patente: '',
    marca: '',
    modelo: '',
    año: '',
    tipo_vehiculo: 'Camión',
    estado: 'Operativo',
    id_chofer_asignado: '',
    color: '',
    vin: '',
    n_motor: '',
    n_chasis: '',
    pais_manufactura: '',
    tipo_combustible: 'Diesel',
  });
  
  const [conductores, setConductores] = useState<User[]>([]);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true); 
  
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchConductores();
          fetchVehiculoData();
        } else {
          toast.error('No tienes permiso para acceder a esta página.');
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router, id]); 

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
      
      setVehiculoData({
        ...data,
        año: data.año || '', 
        id_chofer_asignado: data.id_chofer_asignado || '',
        color: data.color || '',
        vin: data.vin || '',
        n_motor: data.n_motor || '',
        n_chasis: data.n_chasis || '',
        pais_manufactura: data.pais_manufactura || '',
        tipo_combustible: data.tipo_combustible || 'Diesel',
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
    
    const añoNum = parseInt(vehiculoData.año as string, 10);
    if (isNaN(añoNum)) {
      toast.error('El año debe ser un número válido.');
      return;
    }
    
    setLoadingSubmit(true);
    const toastId = toast.loading('Actualizando vehículo...');
    
    // --- ¡CORRECCIÓN DEFINITIVA! Limpia el ID del chofer asignado antes de enviarlo ---
    const choferIdToSend = vehiculoData.id_chofer_asignado 
      ? vehiculoData.id_chofer_asignado.trim() // Limpieza
      : null;
    // --- FIN CORRECCIÓN ---
    
    try {
      const response = await fetch(`/api/vehiculos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vehiculoData,
          año: añoNum,
          id_chofer_asignado: choferIdToSend // <-- ENVIAMOS EL ID LIMPIO
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
  
  if (authLoading || loadingPage) {
    return <div className="p-8 text-gray-900">Cargando...</div>;
  }
  
  return (
    <div className="p-8 text-gray-900">
      
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-3xl mx-auto">
        
        <h1 className="text-3xl font-bold text-pepsi-blue mb-6">
          Editar Vehículo
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label htmlFor="patente" className="block text-sm font-medium text-gray-700 mb-1">Patente (No editable)</label>
            <input type="text" id="patente" value={vehiculoData.patente} disabled
              className={disabledInputStyle}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input type="text" id="marca" value={vehiculoData.marca} onChange={handleChange}
                className={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input type="text" id="modelo" value={vehiculoData.modelo} onChange={handleChange}
                className={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="año" className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <input type="number" id="año" value={vehiculoData.año} onChange={handleChange}
                className={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input type="text" id="color" value={vehiculoData.color} onChange={handleChange}
                className={inputStyle}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="tipo_vehiculo" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vehículo</label>
            <select id="tipo_vehiculo" value={vehiculoData.tipo_vehiculo} onChange={handleChange}
              className={inputStyle}
            >
              <option value="Camión">Camión</option>
              <option value="Camioneta">Camioneta</option>
              <option value="Auto">Auto</option>
              <option value="Grúa Horquilla">Grúa Horquilla</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <hr className="my-6 border-t border-gray-200" />

          <div>
            <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">VIN (N° Identificación)</label>
            <input type="text" id="vin" value={vehiculoData.vin} onChange={handleChange}
              className={inputStyle}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="n_motor" className="block text-sm font-medium text-gray-700 mb-1">N° Motor</label>
              <input type="text" id="n_motor" value={vehiculoData.n_motor} onChange={handleChange}
                className={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="n_chasis" className="block text-sm font-medium text-gray-700 mb-1">N° Chasis</label>
              <input type="text" id="n_chasis" value={vehiculoData.n_chasis} onChange={handleChange}
                className={inputStyle}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="pais_manufactura" className="block text-sm font-medium text-gray-700 mb-1">País Manufactura</label>
              <input type="text" id="pais_manufactura" value={vehiculoData.pais_manufactura} onChange={handleChange}
                className={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="tipo_combustible" className="block text-sm font-medium text-gray-700 mb-1">Combustible</label>
              <select id="tipo_combustible" value={vehiculoData.tipo_combustible} onChange={handleChange}
                className={inputStyle}
              >
                <option value="Diesel">Diesel</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Eléctrico">Eléctrico</option>
                <option value="Híbrido">Híbrido</
                option>
                <option value="Gas">Gas</option>
              </select>
            </div>
          </div>
          
          <hr className="my-6 border-t border-gray-200" />
          
          <div>
            <label htmlFor="id_chofer_asignado" className="block text-sm font-medium text-gray-700 mb-1">Conductor Asignado</label>
            <select id="id_chofer_asignado" value={vehiculoData.id_chofer_asignado} onChange={handleChange}
              className={inputStyle}
            >
              <option value="">Ninguno</option>
              {conductores.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select id="estado" value={vehiculoData.estado} onChange={handleChange}
              className={inputStyle}
            >
              <option value="Operativo">Operativo</option>
              <option value="En Taller">En Taller</option>
              <option value="De Baja">De Baja</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <Link href="/gestion-vehiculos">
              <span className="px-5 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium cursor-pointer">
                Cancelar
              </span>
            </Link>
            
            <button
              type="submit"
              disabled={loadingSubmit}
              className="px-5 py-2 rounded-md text-white bg-pepsi-blue hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              {loadingSubmit ? 'Guardando...' : 'Guardar Cambios'}
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