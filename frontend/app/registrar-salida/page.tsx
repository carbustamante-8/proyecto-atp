// frontend/app/registrar-salida/page.tsx
// (CÓDIGO ACTUALIZADO: Reemplazado confirm() por toast.promise)

'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; 

type OTFinalizada = {
  id: string;
  patente: string;
  nombre_conductor?: string;
  mecanicoAsignadoNombre?: string;
  fechaIngresoTaller?: { _seconds: number };
  fechaSalidaTaller?: any; 
  estado: string;
};

export default function RegistrarSalidaPage() {
  
  const [otsParaSalida, setOtsParaSalida] = useState<OTFinalizada[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null); // ¡Restaurado!
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile && userProfile.rol === 'Guardia') {
        fetchOtsParaSalida();
      } else if (user && userProfile) {
        // Redirige a otros roles si no son Guardia
        router.push('/');
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchOtsParaSalida = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo');
      if (!response.ok) throw new Error('Error al cargar vehículos');
      const data: OTFinalizada[] = await response.json();
      
      const salidaPendiente = data.filter(ot => 
        (ot.estado === 'Finalizado' || ot.estado === 'Cerrado') && 
        !ot.fechaSalidaTaller
      );
      setOtsParaSalida(salidaPendiente);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ¡handleRegistrarSalida (MODIFICADO)! ---
  const handleRegistrarSalida = async (otId: string) => {
    // ¡Ya no hay confirm()!
    setActualizandoId(otId); // Bloquea el botón

    const promise = fetch(`/api/ordenes-trabajo/${otId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'registrarSalida' }),
    });

    toast.promise(promise, {
      loading: 'Registrando salida...',
      success: (res) => {
        if (!res.ok) throw new Error('Falló el registro de salida');
        setOtsParaSalida(prev => prev.filter(ot => ot.id !== otId));
        setActualizandoId(null);
        return '¡Salida registrada!';
      },
      error: (err) => {
        setActualizandoId(null);
        return err.message || 'Error al registrar la salida';
      }
    });
  };

  if (authLoading || !userProfile) return <div className="p-8">Cargando...</div>;
  
  return (
    <div className="p-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Registrar Salida de Vehículo</h1>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Patente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Conductor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Mecánico</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Ingreso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? <tr><td colSpan={5} className="p-4 text-center">Cargando...</td></tr> : 
             otsParaSalida.length > 0 ? otsParaSalida.map(ot => (
              <tr key={ot.id}>
                <td className="px-6 py-4 font-bold">{ot.patente}</td>
                <td className="px-6 py-4">{ot.nombre_conductor || 'N/A'}</td>
                <td className="px-6 py-4">{ot.mecanicoAsignadoNombre}</td>
                <td className="px-6 py-4">
                  {ot.fechaIngresoTaller ? new Date(ot.fechaIngresoTaller._seconds * 1000).toLocaleString('es-CL') : '-'}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleRegistrarSalida(ot.id)}
                    disabled={actualizandoId === ot.id} // Deshabilita mientras procesa
                    className="bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {actualizandoId === ot.id ? 'Registrando...' : 'Registrar Salida'}
                  </button>
                </td>
              </tr>
            )) : <tr><td colSpan={5} className="p-4 text-center">No hay vehículos listos para salir.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}