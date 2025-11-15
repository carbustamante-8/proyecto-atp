// frontend/app/portal-conductor/page.tsx
// (CÓDIGO CORREGIDO: El useEffect ahora espera a que authLoading sea false)

'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 

type VehiculoAsignado = {
  id: string;
  patente: string;
  modelo: string;
  año: number;
  tipo_vehiculo: string;
  estado: string;
};

type SolicitudConEstado = {
  id: string;
  descripcion: string;
  fechaSolicitud: { _seconds: number };
  estadoSolicitud: 'Pendiente' | 'Procesado';
  estadoOT: 'Agendado' | 'Pendiente' | 'En Progreso' | 'Finalizado' | 'Cerrado' | 'Anulado' | null;
  fechaHoraAgendada?: { _seconds: number } | null; 
};

export default function PortalConductorPage() {
  
  const [miVehiculo, setMiVehiculo] = useState<VehiculoAsignado | null>(null);
  const [loadingVehiculo, setLoadingVehiculo] = useState(true);
  const [descripcionFalla, setDescripcionFalla] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [misSolicitudes, setMisSolicitudes] = useState<SolicitudConEstado[]>([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- ¡useEffect (ACTUALIZADO CON PROTECCIÓN DE CARGA)! ---
  useEffect(() => {
    // 1. Si la autenticación AÚN ESTÁ CARGANDO, no hagas nada.
    if (authLoading) {
      return; 
    }

    // 2. La autenticación TERMINÓ. Ahora, revisa si hay usuario.
    if (user && userProfile) {
      // 3. Hay usuario. ¿Es Conductor?
      if (userProfile.rol === 'Conductor') {
        // ¡SÍ! Ahora es seguro llamar a las APIs
        fetchMiVehiculo(userProfile.id); 
        fetchMisSolicitudes(userProfile.id);
      } else {
        // No es Conductor, redirige
        toast.error('Acceso denegado');
        router.push('/'); 
      }
    } else {
      // 4. No hay usuario (sesión expirada o nunca iniciada)
      router.push('/');
    }
  }, [user, userProfile, authLoading, router]); // Depende de que 'authLoading' cambie a 'false'

  // (fetchMiVehiculo - sin cambios)
  const fetchMiVehiculo = async (conductorId: string) => {
    setLoadingVehiculo(true);
    try {
      const response = await fetch(`/api/vehiculos/por-conductor/${conductorId}`);
      if (response.status === 404) {
        setMiVehiculo(null);
      } else if (response.ok) {
        setMiVehiculo(await response.json());
      } else {
        throw new Error('No se pudo cargar tu vehículo');
      }
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoadingVehiculo(false);
    }
  };
  
  // (fetchMisSolicitudes - sin cambios)
  const fetchMisSolicitudes = async (conductorId: string) => {
    setLoadingSolicitudes(true);
    try {
      const response = await fetch(`/api/solicitudes/por-conductor/${conductorId}`);
      if (!response.ok) throw new Error('No se pudieron cargar tus solicitudes');
      const data: SolicitudConEstado[] = await response.json();
      const solicitudesActivas = data.filter(sol => {
        if (sol.estadoOT === 'Cerrado' || sol.estadoOT === 'Anulado') {
          return false; 
        }
        return true; 
      });
      setMisSolicitudes(solicitudesActivas); 
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  // (handleSolicitud - sin cambios)
  const handleSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcionFalla || !userProfile || !miVehiculo) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_conductor: userProfile.id,
          nombre_conductor: userProfile.nombre,
          patente_vehiculo: miVehiculo.patente,
          descripcion_falla: descripcionFalla,
        }),
      });
      if (!response.ok) throw new Error('Falló el envío de la solicitud');

      toast.success('¡Solicitud enviada exitosamente!');
      setDescripcionFalla(''); 
      fetchMisSolicitudes(userProfile.id); 
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // (getEstadoConductor - sin cambios)
  const getEstadoConductor = (sol: SolicitudConEstado): { texto: string, color: string } => {
    if (sol.estadoOT === 'Finalizado') {
      return { texto: '¡LISTO PARA RETIRO!', color: 'text-green-600 font-bold' };
    }
    if (sol.estadoOT === 'En Progreso') {
      return { texto: 'En Taller (En Progreso)', color: 'text-yellow-600' };
    }
    if (sol.estadoOT === 'Pendiente') {
      return { texto: 'En Taller (Pendiente de Mecánico)', color: 'text-yellow-600' };
    }
    if (sol.estadoOT === 'Agendado' && sol.fechaHoraAgendada && typeof sol.fechaHoraAgendada === 'object' && sol.fechaHoraAgendada._seconds) {
      const fecha = new Date(sol.fechaHoraAgendada._seconds * 1000).toLocaleString('es-CL');
      return { texto: `Agendado para: ${fecha}`, color: 'text-blue-600' };
    }
    if (sol.estadoOT === 'Agendado') {
      return { texto: 'Agendado (Esperando hora)', color: 'text-blue-600' };
    }
    if (sol.estadoSolicitud === 'Pendiente') {
      return { texto: 'Pendiente de Aprobación (Admin)', color: 'text-gray-500' };
    }
    return { texto: 'Procesado', color: 'text-gray-500' };
  };

  // --- PANTALLA DE CARGA ACTUALIZADA ---
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }
  
  // (Ya no necesitamos esta comprobación, el useEffect la maneja)
  // if (userProfile.rol !== 'Conductor') { ... }

  return (
    <div className="p-8 text-gray-900 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"> 
      
      {/* Columna Izquierda (Acciones) */}
      <div className="md:col-span-1 space-y-8">
        
        {/* --- SECCIÓN 1: MI VEHÍCULO --- */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Mi Vehículo Asignado</h2>
          {loadingVehiculo ? (
            <p>Buscando tu vehículo...</p>
          ) : miVehiculo ? (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Patente</span>
                <p className="font-medium text-lg">{miVehiculo.patente}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Modelo</span>
                <p className="font-medium text-lg">{miVehiculo.modelo} ({miVehiculo.año})</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-700">No tienes un vehículo asignado.</p>
          )}
        </div>

        {/* --- SECCIÓN 2: SOLICITAR MANTENIMIENTO --- */}
        {/* (Este bloque ahora se mostrará correctamente cuando 'miVehiculo' cargue) */}
        {miVehiculo && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">Solicitar Mantenimiento</h2>
            <form onSubmit={handleSolicitud} className="space-y-4">
              <div>
                <label htmlFor="descripcionFalla" className="block text-sm font-medium text-gray-700">
                  Describe la falla o el mantenimiento requerido:
                </label>
                <textarea
                  id="descripcionFalla"
                  rows={4}
                  value={descripcionFalla}
                  onChange={(e) => setDescripcionFalla(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
                  placeholder="Ej: Ruido extraño en el motor..."
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* --- Columna Derecha (Estado de Solicitudes) --- */}
      <div className="md:col-span-2">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Estado de mis Solicitudes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Solicitud</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingSolicitudes ? (
                  <tr><td colSpan={3} className="px-6 py-4 text-center">Cargando solicitudes...</td></tr>
                ) : misSolicitudes.length > 0 ? (
                  misSolicitudes.map(sol => {
                    const estado = getEstadoConductor(sol); 
                    return (
                      <tr key={sol.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(sol.fechaSolicitud._seconds * 1000).toLocaleString('es-CL')}
                        </td>
                        <td className="px-6 py-4">{sol.descripcion}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${estado.color}`}>
                          {estado.texto}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={3} className="px-6 py-4 text-center">No tienes solicitudes activas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}