// frontend/app/control-acceso/page.tsx
// (CÓDIGO ACTUALIZADO: Filtra por "HOY" y muestra la hora de la cita)

'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 

// --- Tipo de Dato (Actualizado) ---
type OrdenAgendada = {
  id: string;
  patente: string;
  descripcionProblema: string;
  fechaCreacion: { _seconds: number };
  fechaHoraAgendada?: { _seconds: number } | null; // ¡Necesario para filtrar y mostrar!
};

export default function ControlAccesoPage() {
  
  const [otsAgendadasHoy, setOtsAgendadasHoy] = useState<OrdenAgendada[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState(''); 
  const [actualizandoId, setActualizandoId] = useState<string | null>(null); 
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- Lógica de Protección y Carga ---
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

  // --- Función de Carga de Datos (¡CON FILTRO DE HOY!) ---
  const fetchOtsAgendadas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo'); 
      if (!response.ok) throw new Error('No se pudieron cargar las OTs agendadas');
      
      const data: OrdenAgendada[] = await response.json();
      
      // --- ¡NUEVO FILTRO DE FECHA! ---
      const hoyInicio = new Date();
      hoyInicio.setHours(0, 0, 0, 0); // 00:00:00 de hoy
      const hoyFin = new Date();
      hoyFin.setHours(23, 59, 59, 999); // 23:59:59 de hoy

      const agendadasHoy = data.filter(ot => {
        // 1. Debe estar 'Agendado'
        if ((ot as any).estado !== 'Agendado') return false;
        
        // 2. Debe tener una fecha de agendamiento
        if (!ot.fechaHoraAgendada || !ot.fechaHoraAgendada._seconds) return false;
        
        // 3. La fecha debe ser hoy
        const fechaCita = new Date(ot.fechaHoraAgendada._seconds * 1000);
        return fechaCita >= hoyInicio && fechaCita <= hoyFin;
      });
      // --- FIN DEL FILTRO ---
      
      // Ordena por hora de cita (más temprano primero)
      agendadasHoy.sort((a, b) => (a.fechaHoraAgendada?._seconds || 0) - (b.fechaHoraAgendada?._seconds || 0));
      
      setOtsAgendadasHoy(agendadasHoy);

    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Acción del Botón "Registrar Llegada" (sin cambios) ---
  const handleRegistrarLlegada = async (otId: string) => {
    setActualizandoId(otId); 
    try {
      const response = await fetch(`/api/ordenes-trabajo/${otId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'Pendiente', 
          accion: 'registrarLlegada' 
        }),
      });

      if (!response.ok) throw new Error('Error al registrar la llegada');
      
      toast.success('¡Llegada registrada! La OT fue enviada al pool del taller.');
      setOtsAgendadasHoy(actuales => actuales.filter(ot => ot.id !== otId));

    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setActualizandoId(null); 
    }
  };

  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }
  
  // Filtra las OTs de HOY según la búsqueda
  const otsFiltradas = otsAgendadasHoy.filter(ot => 
    ot.patente.replace(/\s+/g, '').toUpperCase()
    .includes(busqueda.replace(/\s+/g, '').toUpperCase())
  );

  return (
    <div className="p-8 text-gray-900">
      
      <h1 className="text-3xl font-bold mb-4">Control de Acceso (Vehículos Agendados para HOY)</h1>
      <p className="text-gray-600 mb-6">Lista de OTs que tienen cita programada para el día de hoy.</p>

      {/* Barra de Búsqueda por Patente */}
      <div className="mb-6">
        <label htmlFor="busqueda" className="block text-sm font-medium text-gray-700">Buscar Patente</label>
        <input
          type="text" id="busqueda" value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Ej: AB-CD-12"
          className="mt-1 block w-full max-w-md px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
        />
      </div>

      {/* --- Tabla de OTs Agendadas (ACTUALIZADA) --- */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* --- ¡NUEVA COLUMNA! --- */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora Agendada</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción / Motivo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center">Cargando OTs agendadas...</td></tr>
            ) : otsFiltradas.length > 0 ? (
              otsFiltradas.map(ot => (
                <tr key={ot.id}>
                  {/* --- ¡NUEVA CELDA! --- */}
                  <td className="px-6 py-4 font-semibold text-blue-600">
                    {ot.fechaHoraAgendada ? new Date(ot.fechaHoraAgendada._seconds * 1000).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-medium">{ot.patente}</td>
                  <td className="px-6 py-4">{ot.descripcionProblema}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleRegistrarLlegada(ot.id)}
                      disabled={actualizandoId === ot.id} 
                      className="bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {actualizandoId === ot.id ? 'Registrando...' : 'Registrar Llegada'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-6 py-4 text-center">
                {busqueda ? 'No se encontraron OTs con esa patente.' : 'No hay OTs agendadas para hoy.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}