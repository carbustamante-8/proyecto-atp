// frontend/app/gestion-vehiculos/crear/page.tsx
// (CÓDIGO CORREGIDO: Arreglado el bucle de carga y los roles)

'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type User = {
  id: string;
  nombre: string;
  rol: string;
};

export default function CrearVehiculoPage() {
  const [patente, setPatente] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [año, setAño] = useState(new Date().getFullYear());
  const [tipoVehiculo, setTipoVehiculo] = useState('Camión');
  const [estado, setEstado] = useState('Operativo');
  const [idChoferAsignado, setIdChoferAsignado] = useState('');
  
  const [conductores, setConductores] = useState<User[]>([]);
  
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingData, setLoadingData] = useState(true); // <-- Estado de carga de página
  
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  // --- useEffect CORREGIDO ---
  useEffect(() => {
    if (authLoading) {
      return; // 1. Espera a que la autenticación termine
    }
    
    if (user && userProfile) {
      // 2. Autenticación lista, revisa roles
      // --- ¡ROLES ACTUALIZADOS (SIN JEFE DE TALLER)! ---
      const rolesPermitidos = ['Supervisor', 'Coordinador']; 
      
      if (rolesPermitidos.includes(userProfile.rol)) {
        // 3. Tiene permiso, carga los datos
        fetchConductores();
      } else {
        // 4. No tiene permiso
        toast.error('No tienes permiso para acceder a esta página.');
        router.push('/');
      }
    } else {
      // 5. No está logueado
      toast.error('Sesión no válida.');
      router.push('/');
    }
  }, [user, userProfile, authLoading, router]); // Dependencias correctas

  // --- fetchConductores CORREGIDO ---
  const fetchConductores = async () => {
    // setLoadingData(true) ya está en true
    try {
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('No se pudo cargar la lista de conductores');
      const usuarios: User[] = await response.json();
      const conductoresActivos = usuarios.filter(u => u.rol === 'Conductor');
      setConductores(conductoresActivos);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      // 6. Avisa que la carga de datos terminó
      setLoadingData(false);
    }
  };

  // --- handleSubmit CORREGIDO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true); // <-- Usa el estado del botón
    const toastId = toast.loading('Creando vehículo...');

    try {
      const response = await fetch('/api/vehiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          patente: patente.toUpperCase(), 
          marca, 
          modelo, 
          año: Number(año), // Asegura que sea número
          tipo_vehiculo: tipoVehiculo, 
          estado,
          id_chofer_asignado: idChoferAsignado || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el vehículo');
      }

      toast.success('¡Vehículo creado exitosamente!', { id: toastId });
      router.push('/gestion-vehiculos');

    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, { id: toastId });
      } else {
        toast.error('Ocurrió un error inesperado', { id: toastId });
      }
    } finally {
      setLoadingSubmit(false); // <-- Usa el estado del botón
    }
  };

  // --- PANTALLA DE CARGA CORREGIDA ---
  if (authLoading || loadingData) {
    return <div className="p-8 text-gray-900">Validando sesión y cargando datos...</div>;
  }
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Registrar Nuevo Vehículo
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... (Inputs Patente, Marca, Modelo, Año, Tipo) ... */}
          <div>
            <label htmlFor="patente" className="block text-sm font-medium text-gray-700">Patente</label>
            <input type="text" id="patente" value={patente} onChange={(e) => setPatente(e.target.value)} required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="marca" className="block text-sm font-medium text-gray-700">Marca</label>
              <input type="text" id="marca" value={marca} onChange={(e) => setMarca(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
            </div>
            <div>
              <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">Modelo</label>
              <input type="text" id="modelo" value={modelo} onChange={(e) => setModelo(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
            </div>
          </div>
          <div>
            <label htmlFor="año" className="block text-sm font-medium text-gray-700">Año</label>
            <input type="number" id="año" value={año} onChange={(e) => setAño(parseInt(e.target.value))}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
          </div>
          <div>
            <label htmlFor="tipoVehiculo" className="block text-sm font-medium text-gray-700">Tipo de Vehículo</label>
            <select id="tipoVehiculo" value={tipoVehiculo} onChange={(e) => setTipoVehiculo(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50">
              <option value="Camión">Camión</option>
              <option value="Camioneta">Camioneta</option>
              <option value="Auto">Auto</option>
              <option value="Grúa Horquilla">Grúa Horquilla</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          
          {/* (Selects Conductor y Estado) */}
          <div>
            <label htmlFor="idChoferAsignado" className="block text-sm font-medium text-gray-700">Conductor Asignado (Opcional)</label>
            <select id="idChoferAsignado" value={idChoferAsignado} onChange={(e) => setIdChoferAsignado(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50">
              <option value="">Ninguno</option>
              {conductores.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
            <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value)}
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
              disabled={loadingSubmit} 
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loadingSubmit ? 'Guardando...' : 'Guardar Vehículo'}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/gestion-vehiculos')}
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