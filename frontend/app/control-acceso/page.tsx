// frontend/app/control-acceso/page.tsx
// (CÓDIGO CORREGIDO: Restaurado el modal, pero SIN fondo)

'use client'; 

import { useState, useEffect, Fragment } from 'react'; // ¡Restaurado Fragment!
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 

type OrdenAgendada = {
  id: string;
  patente: string;
  descripcionProblema: string;
  nombre_conductor?: string; 
  fechaHoraAgendada?: { _seconds: number } | null; 
};

export default function ControlAccesoPage() {
  
  const [otsAgendadasHoy, setOtsAgendadasHoy] = useState<OrdenAgendada[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState(''); 
  const [actualizandoId, setActualizandoId] = useState<string | null>(null); 
  
  // --- ¡Restaurados! Estados para el Modal ---
  const [modalAbierto, setModalAbierto] = useState(false);
  const [otParaRegistrar, setOtParaRegistrar] = useState<OrdenAgendada | null>(null);
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // (useEffect y fetchOtsAgendadas no cambian)
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        if (userProfile.rol === 'Guardia') {
          fetchOtsAgendadas();
        } else {
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchOtsAgendadas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo'); 
      if (!response.ok) throw new Error('No se pudieron cargar las OTs agendadas');
      
      const data: OrdenAgendada[] = await response.json();
      
      const hoyInicio = new Date();
      hoyInicio.setHours(0, 0, 0, 0); 
      const hoyFin = new Date();
      hoyFin.setHours(23, 59, 59, 999); 

      const agendadasHoy = data.filter(ot => {
        if ((ot as any).estado !== 'Agendado') return false;
        if (!ot.fechaHoraAgendada || !ot.fechaHoraAgendada._seconds) return false;
        const fechaCita = new Date(ot.fechaHoraAgendada._seconds * 1000);
        return fechaCita >= hoyInicio && fechaCita <= hoyFin;
      });
      
      agendadasHoy.sort((a, b) => (a.fechaHoraAgendada?._seconds || 0) - (b.fechaHoraAgendada?._seconds || 0));
      setOtsAgendadasHoy(agendadasHoy);

    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // --- ¡Restauradas! Funciones del Modal ---
  const handleAbrirModal = (ot: OrdenAgendada) => {
    setOtParaRegistrar(ot);
    setModalAbierto(true);
  };

  const handleCerrarModal = () => {
    setOtParaRegistrar(null);
    setModalAbierto(false);
  };
  
  // --- ¡Restaurado! handleConfirmarLlegada ---
  const handleConfirmarLlegada = async () => {
    if (!otParaRegistrar) return;
    
    setActualizandoId(otParaRegistrar.id); 
    setModalAbierto(false); // Cierra el modal

    const promise = fetch(`/api/ordenes-trabajo/${otParaRegistrar.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: 'Pendiente', 
        accion: 'registrarLlegada' 
      }),
    });

    toast.promise(promise, {
      loading: 'Registrando ingreso...',
      success: (res) => {
        if (!res.ok) throw new Error('Error al registrar la llegada');
        setOtsAgendadasHoy(actuales => actuales.filter(ot => ot.id !== otParaRegistrar.id));
        setOtParaRegistrar(null);
        setActualizandoId(null);
        return '¡Llegada registrada!';
      },
      error: (err) => {
        setOtParaRegistrar(null);
        setActualizandoId(null);
        return err.message || 'Error al registrar la llegada';
      }
    });
  };

  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }
  
  const otsFiltradas = otsAgendadasHoy.filter(ot => 
    ot.patente.replace(/\s+/g, '').toUpperCase()
    .includes(busqueda.replace(/\s+/g, '').toUpperCase())
  );

  return (
    <Fragment>
    
      {/* --- ¡MODAL SIN FONDO! --- */}
      {modalAbierto && otParaRegistrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 1. Overlay TRANSPARENTE (solo para cerrar al hacer clic afuera) */}
          <div 
            className="absolute inset-0" 
            onClick={handleCerrarModal}
          ></div>
          {/* 2. Caja Blanca (Contenido) */}
          <div className="relative z-10 bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Ingreso</h2>
            <p className="text-gray-700 mb-2">
              Patente: <strong className="text-blue-600">{otParaRegistrar.patente}</strong>
            </p>
            <p className="text-gray-700 mb-6">
              Conductor: <strong className="text-blue-600">{otParaRegistrar.nombre_conductor || 'No registrado'}</strong>
            </p>
            <p className="text-gray-700 mb-6">
              ¿Confirmas que los datos son correctos y el vehículo está ingresando al taller?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCerrarModal}
                className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarLlegada}
                disabled={actualizandoId === otParaRegistrar.id}
                className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 font-medium disabled:bg-gray-400"
              >
                {actualizandoId ? 'Registrando...' : 'Sí, Confirmar Ingreso'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- FIN DEL MODAL --- */}

      <div className="p-8 text-gray-900">
        <h1 className="text-3xl font-bold mb-4">Control de Acceso (Vehículos Agendados para HOY)</h1>
        {/* ... (resto del JSX sin cambios) ... */}
        <p className="text-gray-600 mb-6">Lista de OTs que tienen cita programada para el día de hoy.</p>
        <div className="mb-6">
          <label htmlFor="busqueda" className="block text-sm font-medium text-gray-700">Buscar Patente</label>
          <input
            type="text" id="busqueda" value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej: AB-CD-12"
            className="mt-1 block w-full max-w-md px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
          />
        </div>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora Agendada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor Esperado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando OTs agendadas...</td></tr>
              ) : otsFiltradas.length > 0 ? (
                otsFiltradas.map(ot => (
                  <tr key={ot.id}>
                    <td className="px-6 py-4 font-semibold text-blue-600">
                      {ot.fechaHoraAgendada ? new Date(ot.fechaHoraAgendada._seconds * 1000).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-medium">{ot.patente}</td>
                    <td className="px-6 py-4 font-medium">{ot.nombre_conductor || 'No registrado'}</td>
                    <td className="px-6 py-4">{ot.descripcionProblema}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleAbrirModal(ot)} // ¡Llama al modal!
                        disabled={actualizandoId === ot.id} 
                        className="bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {actualizandoId === ot.id ? '...' : 'Registrar Llegada'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-4 text-center">
                  {busqueda ? 'No se encontraron OTs con esa patente.' : 'No hay OTs agendadas para hoy.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Fragment>
  );
}