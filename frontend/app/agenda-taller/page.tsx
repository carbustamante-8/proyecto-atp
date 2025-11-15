// frontend/app/agenda-taller/page.tsx
// (CÓDIGO CORREGIDO: Añadida validación en .sort() para evitar error ts(18048))

'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link'; 

type OTAgendada = {
  id: string;
  patente: string;
  nombre_conductor?: string;
  descripcionProblema: string;
  fechaHoraAgendada?: { _seconds: number }; // Es opcional
  estado: string; 
};

export default function AgendaTallerPage() {
  
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
      
      // 1. Filtrar las 'Agendado' (Citas futuras)
      const agendadas = data.filter(ot => 
        ot.estado === 'Agendado' && ot.fechaHoraAgendada?._seconds
      );
      
      // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
      // Añadimos valores por defecto (|| 0) para que TypeScript no se queje
      agendadas.sort((a, b) => (a.fechaHoraAgendada?._seconds || 0) - (b.fechaHoraAgendada?._seconds || 0));
      setCitasAgendadas(agendadas);
      
      // 2. Filtrar las 'Pendiente' (Pool para asignar)
      const pendientes = data.filter(ot => ot.estado === 'Pendiente');
      pendientes.sort((a: any, b: any) => (a.fechaIngresoTaller?._seconds || 0) - (b.fechaIngresoTaller?._seconds || 0)); 
      setPendientesAsignar(pendientes);

    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }

  return (
    <div className="p-8 text-gray-900 space-y-12">
      
      {/* --- Tabla 1: Citas Agendadas (Solo Lectura) --- */}
      <div>
        <h1 className="text-3xl font-bold mb-6">Agenda del Taller (Próximas Citas)</h1>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha y Hora Agendada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="p-4 text-center">Cargando agenda...</td></tr>
              ) : citasAgendadas.length > 0 ? (
                citasAgendadas.map(ot => (
                  <tr key={ot.id}>
                    <td className="px-6 py-4 font-semibold text-blue-600">
                      {/* Hacemos la misma comprobación segura aquí por si acaso, 
                        aunque el filtro ya debería haberlo hecho.
                      */}
                      {ot.fechaHoraAgendada?._seconds ? 
                        new Date(ot.fechaHoraAgendada._seconds * 1000).toLocaleString('es-CL') : 'Fecha no definida'
                      }
                    </td>
                    <td className="px-6 py-4 font-medium">{ot.patente}</td>
                    <td className="px-6 py-4">{ot.nombre_conductor || '-'}</td>
                    <td className="px-6 py-4">{ot.descripcionProblema}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="p-4 text-center">No hay OTs agendadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Tabla 2: Pendientes de Asignar (El Pool del Admin) --- */}
      <div>
        <h1 className="text-3xl font-bold mb-6">Pool de Tareas (Pendientes de Asignar)</h1>
        <p className="text-gray-600 mb-6 -mt-6 text-sm">Vehículos que el Guardia ya ingresó y están esperando asignación de mecánico.</p>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="p-4 text-center">Cargando pool...</td></tr>
              ) : pendientesAsignar.length > 0 ? (
                pendientesAsignar.map(ot => (
                  <tr key={ot.id}>
                    <td className="px-6 py-4 font-medium">{ot.patente}</td>
                    <td className="px-6 py-4">{ot.nombre_conductor || '-'}</td>
                    <td className="px-6 py-4">{ot.descripcionProblema}</td>
                    <td className="px-6 py-4">
                      <Link href={`/tareas-detalle/${ot.id}`}>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 cursor-pointer">
                          Asignar
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="p-4 text-center">No hay OTs pendientes de asignar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}