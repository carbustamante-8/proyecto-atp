// frontend/app/solicitudes-pendientes/page.tsx
'use client'; 

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 

type Solicitud = {
  id: string;
  patente_vehiculo: string; 
  nombre_conductor: string;
  id_conductor: string;
  descripcion_falla: string;
  estado: string; 
  fechaCreacion: { _seconds: number };
};

export default function SolicitudesPendientesPage() {
  
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<Solicitud[]>([]);
  const [historial, setHistorial] = useState<Solicitud[]>([]); // <--- NUEVO ESTADO
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null); 

  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const fetchSolicitudes = async () => {
    try {
      const response = await fetch('/api/solicitudes');
      if (!response.ok) throw new Error('Error al cargar');
      const data: Solicitud[] = await response.json();
      
      // SEPARAMOS LAS LISTAS AQUÍ
      setSolicitudesPendientes(data.filter(s => s.estado === 'Pendiente'));
      setHistorial(data.filter(s => s.estado !== 'Pendiente')); // Procesadas (Aceptadas)
      
    } catch (err) {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchSolicitudes();
        } else {
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const handleAgendarOT = (solicitud: Solicitud) => {
    toast.success('Redirigiendo...');
    const params = new URLSearchParams();
    params.set('patente', solicitud.patente_vehiculo); 
    params.set('motivo', solicitud.descripcion_falla);
    params.set('id_conductor', solicitud.id_conductor);
    params.set('nombre_conductor', solicitud.nombre_conductor);
    params.set('solicitud_id', solicitud.id);
    router.push(`/crear-ot?${params.toString()}`);
  };

  const handleRechazarSolicitud = async (solicitud: Solicitud) => {
    setProcesandoId(solicitud.id); 
    const promise = fetch(`/api/solicitudes?id=${solicitud.id}`, { method: 'DELETE' });
    toast.promise(promise, {
      loading: 'Rechazando...',
      success: () => {
        setSolicitudesPendientes(prev => prev.filter(s => s.id !== solicitud.id));
        setProcesandoId(null);
        return 'Rechazada';
      },
      error: () => { setProcesandoId(null); return 'Error'; }
    });
  };
  
  if (authLoading || loading) return <div className="p-8 font-sans">Cargando bandeja...</div>;

  return (
    <Fragment>
      <div className="p-8 font-sans max-w-7xl mx-auto space-y-12">
        
        {/* --- TABLA 1: PENDIENTES (ACCIÓN REQUERIDA) --- */}
        <div>
            <h1 className="text-3xl font-bold text-pepsi-blue mb-6">Solicitudes Pendientes</h1>
            <div className="bg-white shadow-lg rounded-lg overflow-x-auto border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase">Patente</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase">Conductor</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase">Falla Reportada</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-red-800 uppercase">Acciones</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {solicitudesPendientes.length > 0 ? (
                    solicitudesPendientes.map(sol => (
                    <tr key={sol.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(sol.fechaCreacion._seconds * 1000).toLocaleDateString('es-CL')}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">{sol.patente_vehiculo}</td>
                        <td className="px-6 py-4 text-gray-700">{sol.nombre_conductor}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{sol.descripcion_falla}</td>
                        <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => handleRechazarSolicitud(sol)} disabled={procesandoId === sol.id} className="text-red-600 hover:text-red-800 font-medium text-sm underline disabled:opacity-50">
                            Rechazar
                        </button>
                        <button onClick={() => handleAgendarOT(sol)} disabled={procesandoId === sol.id} className="bg-pepsi-blue text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50 font-medium text-sm">
                            Crear OT
                        </button>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">No hay solicitudes nuevas.</td></tr>
                )}
                </tbody>
            </table>
            </div>
        </div>

        {/* --- TABLA 2: HISTORIAL (SOLO LECTURA) --- */}
        <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Historial de Solicitudes Procesadas</h2>
            <div className="bg-white shadow rounded-lg overflow-x-auto border border-gray-200 opacity-80">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {historial.length > 0 ? (
                    historial.map(sol => (
                    <tr key={sol.id}>
                        <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(sol.fechaCreacion._seconds * 1000).toLocaleDateString('es-CL')}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-700">{sol.patente_vehiculo}</td>
                        <td className="px-6 py-4 text-gray-500">{sol.nombre_conductor}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{sol.descripcion_falla}</td>
                        <td className="px-6 py-4 text-right">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            {sol.estado}
                        </span>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr><td colSpan={5} className="px-6 py-6 text-center text-gray-400 text-sm">El historial está vacío.</td></tr>
                )}
                </tbody>
            </table>
            </div>
        </div>

      </div>
    </Fragment>
  );
}