// frontend/app/solicitudes-pendientes/page.tsx
// (CÓDIGO CORREGIDO: handleAgendarOT ahora conecta la Solicitud con la OT)

'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 

type Solicitud = {
  id: string;
  patente_vehiculo: string;
  nombre_conductor: string;
  descripcion_falla: string;
  fechaCreacion: { _seconds: number };
  estado: string;
};

export default function BandejaDeTallerPage() {
  
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // (useEffect y fetchSolicitudesPendientes no cambian)
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchSolicitudesPendientes();
        } else { router.push('/'); }
      } else if (!user) { router.push('/'); }
    }
  }, [user, userProfile, authLoading, router]);

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

  // --- ¡handleAgendarOT (MODIFICADO)! ---
  const handleAgendarOT = async (solicitud: Solicitud) => {
    setProcesandoId(solicitud.id); 
    
    const promise = (async () => {
      // 1. Crear la OT
      const otResponse = await fetch('/api/ordenes-trabajo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patente: solicitud.patente_vehiculo,
          descripcionProblema: solicitud.descripcion_falla,
          // ¡ENVIAMOS EL NOMBRE!
          nombre_conductor: solicitud.nombre_conductor, 
        }),
      });
      if (!otResponse.ok) throw new Error('Fallo al crear la OT.');
      
      // ¡NUEVO! Captura el ID de la OT recién creada
      const nuevaOT = await otResponse.json();
      const nuevaOtId = nuevaOT.id;

      // 2. Actualizar la Solicitud (¡ahora con el ID de la OT!)
      const solResponse = await fetch('/api/solicitudes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: solicitud.id,
          estado: 'Procesado',
          id_ot_relacionada: nuevaOtId // <-- ¡Aquí está la conexión!
        }),
      });
      if (!solResponse.ok) throw new Error('Fallo al actualizar la solicitud.');
    })();

    toast.promise(promise, {
      loading: 'Agendando OT...',
      success: () => {
        setSolicitudes(actuales => actuales.filter(s => s.id !== solicitud.id));
        setProcesandoId(null);
        return '¡OT Agendada! Ya es visible para el Guardia.';
      },
      error: (err) => {
        setProcesandoId(null);
        return err.message || 'Ocurrió un error inesperado.';
      }
    });
  };

  // (handleRechazarSolicitud no cambia)
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

  // (El renderizado JSX no cambia)
  // ... (Se omite el JSX por brevedad, es idéntico al anterior) ...
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  return (
    <div className="p-8 text-gray-900 space-y-12"> 
      <h1 className="text-3xl font-bold">Bandeja de Taller</h1>
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
                        disabled={procesandoId === req.id}
                        className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {procesandoId === req.id ? '...' : 'Agendar OT'}
                      </button>
                      <button 
                        onClick={() => handleRechazarSolicitud(req)}
                        disabled={procesandoId === req.id}
                        className="bg-red-600 text-white px-3 py-1 rounded shadow hover:bg-red-700 disabled:bg-gray-400"
                      >
                        {procesandoId === req.id ? '...' : 'Rechazar'}
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
    </div>
  );
}