// frontend/app/cierre-ots/page.tsx
'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 

type OTFinalizada = {
  id: string;
  patente: string;
  descripcionProblema: string;
  mecanicoAsignadoNombre: string;
  fechaCreacion: { _seconds: number };
};

export default function CierreOtsPage() {
  const [otsFinalizadas, setOtsFinalizadas] = useState<OTFinalizada[]>([]);
  const [loading, setLoading] = useState(true);
  const [cerrandoId, setCerrandoId] = useState<string | null>(null); 
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        // --- ¡ROL CORREGIDO! ---
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchOtsFinalizadas();
        } else { 
          toast.error('Acceso denegado');
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // (fetchOtsFinalizadas - sin cambios)
  const fetchOtsFinalizadas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo'); 
      if (!response.ok) throw new Error('No se pudieron cargar las OTs finalizadas');
      const data: any[] = await response.json();
      const finalizadas = data.filter(ot => ot.estado === 'Finalizado');
      setOtsFinalizadas(finalizadas);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // (handleCerrarOT - sin cambios)
  const handleCerrarOT = async (otId: string) => {
    setCerrandoId(otId); 
    const promise = fetch(`/api/ordenes-trabajo/${otId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'Cerrado',
          accion: 'cierreAdministrativo'
        }),
      });
    toast.promise(promise, {
      loading: 'Cerrando OT...',
      success: (res) => {
        if (!res.ok) throw new Error('Error al cerrar la OT');
        setOtsFinalizadas(actuales => actuales.filter(ot => ot.id !== otId));
        setCerrandoId(null);
        return '¡OT Cerrada Administrativamente!';
      },
      error: (err) => {
        setCerrandoId(null);
        return err.message;
      }
    });
  };
  
  const handleRevisarOT = (otId: string) => {
    window.open(`/tareas-detalle/${otId}`, '_blank');
  };

  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }
  
  // (Renderizado JSX - sin cambios)
  return (
    <div className="p-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-4">Cierre Administrativo de OTs</h1>
      <p className="text-gray-600 mb-6">Lista de OTs finalizadas por los mecánicos, pendientes de cierre y archivo.</p>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mecánico</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center">Cargando OTs finalizadas...</td></tr>
            ) : otsFinalizadas.length > 0 ? (
              otsFinalizadas.map(ot => (
                <tr key={ot.id}>
                  <td className="px-6 py-4 font-medium">{ot.patente}</td>
                  <td className="px-6 py-4">{ot.mecanicoAsignadoNombre || 'N/A'}</td>
                  <td className="px-6 py-4">{ot.descripcionProblema}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button 
                      onClick={() => handleRevisarOT(ot.id)}
                      className="bg-gray-500 text-white px-3 py-1 rounded shadow hover:bg-gray-600"
                    >
                      Revisar
                    </button>
                    <button 
                      onClick={() => handleCerrarOT(ot.id)}
                      disabled={cerrandoId === ot.id} 
                      className="bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {cerrandoId === ot.id ? 'Cerrando...' : 'Cerrar OT'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-6 py-4 text-center">
                No hay OTs pendientes de cierre administrativo.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}