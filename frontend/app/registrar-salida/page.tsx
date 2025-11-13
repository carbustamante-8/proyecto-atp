// frontend/app/registrar-salida/page.tsx
// (CÓDIGO ACTUALIZADO: Restaurado el modal, pero SIN fondo)

'use client'; 
import { useState, useEffect, Fragment } from 'react'; // ¡Restaurado Fragment!
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
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  
  // --- ¡Restaurados! Estados para el Modal ---
  const [modalAbierto, setModalAbierto] = useState(false);
  const [otParaRegistrarSalida, setOtParaRegistrarSalida] = useState<OTFinalizada | null>(null);
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // (useEffect y fetchOtsParaSalida no cambian)
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile && userProfile.rol === 'Guardia') {
        fetchOtsParaSalida();
      } else if (user && userProfile) {
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

  // --- ¡Restauradas! Funciones del Modal ---
  const handleAbrirModalSalida = (ot: OTFinalizada) => {
    setOtParaRegistrarSalida(ot);
    setModalAbierto(true);
  };

  const handleCerrarModalSalida = () => {
    setOtParaRegistrarSalida(null);
    setModalAbierto(false);
  };

  // --- ¡Restaurado! handleConfirmarSalida ---
  const handleConfirmarSalida = async () => {
    if (!otParaRegistrarSalida) return;
    
    setActualizandoId(otParaRegistrarSalida.id);
    setModalAbierto(false); 

    const promise = fetch(`/api/ordenes-trabajo/${otParaRegistrarSalida.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'registrarSalida' }),
    });

    toast.promise(promise, {
      loading: 'Registrando salida...',
      success: (res) => {
        if (!res.ok) throw new Error('Falló el registro de salida');
        setOtsParaSalida(prev => prev.filter(ot => ot.id !== otParaRegistrarSalida.id));
        setOtParaRegistrarSalida(null);
        setActualizandoId(null);
        return '¡Salida registrada!';
      },
      error: (err) => {
        setOtParaRegistrarSalida(null);
        setActualizandoId(null);
        return err.message || 'Error al registrar la salida';
      }
    });
  };

  if (authLoading || !userProfile) return <div className="p-8">Cargando...</div>;
  
  return (
    <Fragment>

      {/* --- ¡MODAL SIN FONDO! --- */}
      {modalAbierto && otParaRegistrarSalida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 1. Overlay TRANSPARENTE (para cerrar al hacer clic afuera) */}
          <div 
            className="absolute inset-0" 
            onClick={handleCerrarModalSalida}
          ></div>
          {/* 2. Caja Blanca (Contenido) */}
          <div className="relative z-10 bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Salida</h2>
            <p className="text-gray-700 mb-2">
              Patente: <strong className="text-blue-600">{otParaRegistrarSalida.patente}</strong>
            </p>
            <p className="text-gray-700 mb-6">
              Conductor: <strong className="text-blue-600">{otParaRegistrarSalida.nombre_conductor || 'N/A'}</strong>
            </p>
            <p className="text-gray-700 mb-6">
              ¿Confirmas la salida de este vehículo del taller?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCerrarModalSalida}
                className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarSalida}
                disabled={actualizandoId === otParaRegistrarSalida.id}
                className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 font-medium disabled:bg-gray-400"
              >
                {actualizandoId ? 'Registrando...' : 'Sí, Confirmar Salida'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- FIN DEL MODAL --- */}

      <div className="p-8 text-gray-900">
        <h1 className="text-3xl font-bold mb-6">Registrar Salida de Vehículo</h1>
        {/* ... (resto del JSX sin cambios) ... */}
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
                      onClick={() => handleAbrirModalSalida(ot)} // ¡Llama al modal!
                      disabled={actualizandoId === ot.id}
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
    </Fragment>
  );
}