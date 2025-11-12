// frontend/app/solicitudes-pendientes/page.tsx
// (CÓDIGO ACTUALIZADO: Se eliminó la tabla "Ingresos Físicos")

'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 

// --- Tipo de Dato (Solo Solicitud) ---
type Solicitud = {
  id: string;
  patente_vehiculo: string;
  nombre_conductor: string;
  descripcion_falla: string;
  fechaCreacion: { _seconds: number };
  estado: string;
};

export default function BandejaDeTallerPage() {
  
  // --- Estados (Solo Solicitud) ---
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- Lógica de Protección y Carga ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          // Carga solo las solicitudes digitales
          fetchSolicitudesPendientes();
        } else {
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // --- Función de Carga (Simplificada) ---
  const fetchSolicitudesPendientes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/solicitudes');
      if (!response.ok) throw new Error('No se pudo cargar la lista de solicitudes');
      
      const solicitudesData = await response.json() as Solicitud[];
      setSolicitudes(solicitudesData.filter((s: any) => s.estado === 'Pendiente'));

    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Acciones de los Botones ---

  // 1. Convertir Solicitud en OT
  const handleAgendarOT = (solicitud: Solicitud) => {
    const patente = solicitud.patente_vehiculo;
    const motivo = solicitud.descripcion_falla;
    
    toast.success('Redirigiendo para agendar OT...');
    router.push(`/crear-ot?patente=${encodeURIComponent(patente)}&motivo=${encodeURIComponent(motivo)}`);
  };

  // 2. Rechazar Solicitud
  const handleRechazarSolicitud = async (solicitud: Solicitud) => {
    if (!confirm(`¿Rechazar solicitud de ${solicitud.patente_vehiculo}?`)) return;
    try {
      const response = await fetch(`/api/solicitudes?id=${solicitud.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al rechazar');
      setSolicitudes(actuales => actuales.filter(s => s.id !== solicitud.id));
      toast.success('Solicitud rechazada.');
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  // --- Lógica de Renderizado Temprano ---
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  return (
    <div className="p-8 text-gray-900 space-y-12"> 
      
      <h1 className="text-3xl font-bold">Bandeja de Taller</h1>
      
      {/* --- 1. SOLICITUDES DIGITALES (De Conductores) --- */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Entradas: Solicitudes Digitales (Conductores)</h2>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Solicitud</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando...</td></tr>
              ) : solicitudes.length > 0 ? (
                solicitudes.map(req => (
                  <tr key={req.id}>
                    <td className="px-6 py-4">{new Date(req.fechaCreacion._seconds * 1000).toLocaleString('es-CL')}</td>
                    <td className="px-6 py-4 font-medium">{req.patente_vehiculo}</td>
                    <td className="px-6 py-4">{req.nombre_conductor}</td>
                    <td className="px-6 py-4">{req.descripcion_falla}</td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button 
                        onClick={() => handleAgendarOT(req)}
                        className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
                      >
                        Agendar OT
                      </button>
                      <button 
                        onClick={() => handleRechazarSolicitud(req)}
                        className="bg-red-600 text-white px-3 py-1 rounded shadow hover:bg-red-700"
                      >
                        Rechazar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-4 text-center">No hay solicitudes digitales pendientes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- (La tabla de Ingresos Físicos se eliminó) --- */}
      
    </div>
  );
}