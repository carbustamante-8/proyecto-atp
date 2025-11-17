'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

// (Los tipos de datos no cambian)
type OTAgendada = {
  id: string;
  patente: string;
  nombre_conductor?: string;
  descripcionProblema: string;
  fechaHoraAgendada?: { _seconds: number };
  estado: string; 
};

export default function AgendaTallerPage() {
  
  // (Toda la lógica de 'useState', 'useEffect' y 'fetch' queda idéntica)
  const [citasAgendadas, setCitasAgendadas] = useState<OTAgendada[]>([]);
  const [pendientesAsignar, setPendientesAsignar] = useState<OTAgendada[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && userProfile) {
      if (['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol)) {
        fetchAgendaYPendientes();
      } else {
        router.push('/');
      }
    } else if (!user && !authLoading) {
      router.push('/');
    }
  }, [user, userProfile, authLoading, router]);

  const fetchAgendaYPendientes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo');
      if (!response.ok) throw new Error('No se pudo cargar la agenda');
      
      const data: OTAgendada[] = await response.json();
      
      const agendadas = data.filter(ot => 
        ot.estado === 'Agendado' && ot.fechaHoraAgendada?._seconds
      );
      agendadas.sort((a, b) => (a.fechaHoraAgendada?._seconds || 0) - (b.fechaHoraAgendada?._seconds || 0));
      setCitasAgendadas(agendadas);
      
      const pendientes = data.filter(ot => ot.estado === 'Pendiente');
      pendientes.sort((a: any, b: any) => (a.fechaIngresoTaller?._seconds || 0) - (b.fechaIngresoTaller?._seconds || 0)); 
      setPendientesAsignar(pendientes);

    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 font-sans">Validando sesión...</div>;
  }

  // --- JSX REFACTORIZADO VISUALMENTE ---
  return (
    // Aplicamos el padding estándar y la fuente
    <div className="p-8 font-sans space-y-12">
      
      {/* --- Tabla 1: Citas Agendadas (Tarjeta Blanca) --- */}
      <div>
        {/* Título con color Pepsi */}
        <h1 className="text-3xl font-bold text-pepsi-blue mb-6">Agenda del Taller (Próximas Citas)</h1>
        
        {/* Usamos la sombra 'shadow-card' de nuestra config */}
        <div className="bg-white shadow-card rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Usamos el color 'neutral-50' para el header */}
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Fecha y Hora Agendada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Conductor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Descripción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {citasAgendadas.length > 0 ? (
                citasAgendadas.map(ot => (
                  <tr key={ot.id}>
                    {/* Usamos el color 'pepsi-blue-light' para la fecha */}
                    <td className="px-6 py-4 font-semibold text-pepsi-blue-light">
                      {ot.fechaHoraAgendada?._seconds ? 
                        new Date(ot.fechaHoraAgendada._seconds * 1000).toLocaleString('es-CL') : 'Fecha no definida'
                      }
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-900">{ot.patente}</td>
                    <td className="px-6 py-4 text-neutral-700">{ot.nombre_conductor || '-'}</td>
                    <td className="px-6 py-4 text-neutral-700">{ot.descripcionProblema}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="p-4 text-center text-neutral-700">No hay OTs agendadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Tabla 2: Pendientes de Asignar (Tarjeta Blanca) --- */}
      <div>
        {/* Título con color Pepsi */}
        <h1 className="text-3xl font-bold text-pepsi-blue mb-2">Pool de Tareas</h1>
        <p className="text-neutral-700 mb-6 -mt-1 text-sm">Vehículos que el Guardia ya ingresó y están esperando asignación de mecánico.</p>
        
        {/* Usamos la sombra 'shadow-card' de nuestra config */}
        <div className="bg-white shadow-card rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Usamos el color 'neutral-50' para el header */}
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Conductor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendientesAsignar.length > 0 ? (
                pendientesAsignar.map(ot => (
                  <tr key={ot.id}>
                    <td className="px-6 py-4 font-medium text-neutral-900">{ot.patente}</td>
                    <td className="px-6 py-4 text-neutral-700">{ot.nombre_conductor || '-'}</td>
                    <td className="px-6 py-4 text-neutral-700">{ot.descripcionProblema}</td>
                    <td className="px-6 py-4">
                      {/* Botón de Asignar con estilo Pepsi y animación */}
                      <Link href={`/tareas-detalle/${ot.id}`}>
                        <span className="bg-pepsi-blue text-white px-4 py-2 rounded-md shadow font-medium hover:bg-pepsi-blue-dark transition-colors duration-200 cursor-pointer">
                          Asignar
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="p-4 text-center text-neutral-700">No hay OTs pendientes de asignar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}