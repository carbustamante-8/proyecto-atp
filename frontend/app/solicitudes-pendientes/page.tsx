// frontend/app/solicitudes-pendientes/page.tsx

'use client'; 

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 
import Link from 'next/link';
import Image from 'next/image';

// --- Iconos para la UI ---
import { 
  CalendarIcon, 
  PhotoIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

// (Tipo de dato de la solicitud)
type Solicitud = {
  id: string;
  patente_vehiculo: string; 
  nombre_conductor: string;
  id_conductor: string;
  descripcion_falla: string;
  estado: string; 
  fechaCreacion: { _seconds: number };
  fotoEvidenciaUrl?: string; 
};

export default function SolicitudesPendientesPage() {
  
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null); 
  const [procesandoId, setProcesandoId] = useState<string | null>(null); 

  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const fetchSolicitudes = async () => {
    // [CORRECCIÓN] Eliminado setLoading(true) redundante. 
    // El estado ya es true desde el useEffect.
    try {
      const response = await fetch('/api/solicitudes');
      if (!response.ok) throw new Error('No se pudieron cargar las solicitudes');
      const data: Solicitud[] = await response.json();
      
      setSolicitudes(data);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false); // ¡Esto debe ejecutarse para salir de la pantalla de carga!
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchSolicitudes();
        } else {
          toast.error('Acceso denegado');
          router.push('/');
          setLoading(false); // [CRUCIAL] Terminar el estado de carga local
        }
      } else if (!user) {
        router.push('/');
        setLoading(false); // [CRUCIAL] Terminar el estado de carga local
      }
    }
  }, [user, userProfile, authLoading, router]);

  // ... (handleAgendarOT y handleRechazarSolicitud no cambian)

  const handleAgendarOT = (solicitud: Solicitud) => {
    toast.success('Redirigiendo para agendar...');
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
      success: (res) => {
        if (!res.ok) throw new Error('Error al rechazar');
        setSolicitudes(actuales => actuales.filter(s => s.id !== solicitud.id));
        setProcesandoId(null);
        return 'Solicitud rechazada.';
      },
      error: (err) => {
        setProcesandoId(null);
        return err.message || 'Error al rechazar.';
      }
    });
  };
  
  if (authLoading || loading) {
    return <div className="p-8 font-sans">Validando sesión y cargando solicitudes...</div>;
  }

  // --- JSX (sin cambios, usa el formato de tabla ya corregido) ---
  return (
    <Fragment>
      {/* --- Modal de Foto Ampliada --- */}
      {fotoAmpliada && (
        <div 
          className="modal-overlay"
          onClick={() => setFotoAmpliada(null)}
        >
          <div className="relative w-full h-full max-w-4xl max-h-[80vh] p-4" onClick={(e) => e.stopPropagation()}>
            <Image 
              src={fotoAmpliada} 
              alt="Evidencia ampliada"
              layout="fill"
              objectFit="contain"
            />
          </div>
          <button
            onClick={() => setFotoAmpliada(null)}
            className="absolute top-4 right-4 bg-white text-neutral-900 rounded-full w-10 h-10 shadow-lg
                     flex items-center justify-center hover:bg-neutral-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* --- Contenedor Principal de la Página --- */}
      <div className="p-8 font-sans">
        
        {/* Título con color Pepsi */}
        <h1 className="text-3xl font-bold text-pepsi-blue mb-6">Bandeja de Taller (Solicitudes Pendientes)</h1>
        
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Solicitud</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción de Falla</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Evidencia</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {solicitudes.length > 0 ? (
                solicitudes.map(solicitud => (
                  <tr key={solicitud.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(solicitud.fechaCreacion._seconds * 1000).toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{solicitud.patente_vehiculo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{solicitud.nombre_conductor}</td>
                    <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-600">{solicitud.descripcion_falla}</td>
                    
                    {/* Celda de Evidencia */}
                    <td className="px-6 py-4 text-center">
                      {solicitud.fotoEvidenciaUrl ? (
                        <button 
                          onClick={() => setFotoAmpliada(solicitud.fotoEvidenciaUrl || null)} 
                          className="text-pepsi-blue hover:text-blue-700 p-1 rounded-full bg-blue-50 transition-colors"
                          title="Ver evidencia"
                        >
                          <PhotoIcon className="h-5 w-5" />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                    
                    {/* Celda de Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                      <button
                        onClick={() => handleRechazarSolicitud(solicitud)}
                        disabled={procesandoId === solicitud.id}
                        className="bg-pepsi-red text-white px-3 py-1 rounded shadow hover:bg-red-700 disabled:bg-gray-400 font-medium text-sm"
                      >
                        Rechazar
                      </button>
                      <button 
                        onClick={() => handleAgendarOT(solicitud)}
                        disabled={procesandoId === solicitud.id}
                        className="bg-pepsi-blue text-white px-3 py-1 rounded shadow hover:bg-blue-700 disabled:bg-gray-400 font-medium text-sm"
                      >
                        Agendar OT
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-lg text-gray-500">
                    No hay solicitudes pendientes de agendar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Fragment>
  );
}