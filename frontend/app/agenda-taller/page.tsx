// frontend/app/agenda-taller/page.tsx
// (PÁGINA NUEVA: Vista de solo lectura de OTs Agendadas)

'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type OTAgendada = {
  id: string;
  patente: string;
  nombre_conductor?: string;
  descripcionProblema: string;
  fechaHoraAgendada: { _seconds: number };
};

export default function AgendaTallerPage() {
  const [citas, setCitas] = useState<OTAgendada[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && userProfile) {
      // Accesible solo para Admins
      if (['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol)) {
        fetchAgenda();
      } else {
        router.push('/');
      }
    } else if (!user && !authLoading) {
      router.push('/');
    }
  }, [user, userProfile, authLoading, router]);

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo');
      if (!response.ok) throw new Error('No se pudo cargar la agenda');
      
      const data: any[] = await response.json();
      
      // 1. Filtrar solo las 'Agendado'
      const agendadas = data.filter(ot => 
        ot.estado === 'Agendado' && ot.fechaHoraAgendada?._seconds
      );
      
      // 2. Ordenar por fecha (más próxima primero)
      agendadas.sort((a, b) => a.fechaHoraAgendada._seconds - b.fechaHoraAgendada._seconds);
      
      setCitas(agendadas);
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
    <div className="p-8 text-gray-900">
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
            ) : citas.length > 0 ? (
              citas.map(ot => (
                <tr key={ot.id}>
                  <td className="px-6 py-4 font-semibold text-blue-600">
                    {new Date(ot.fechaHoraAgendada._seconds * 1000).toLocaleString('es-CL')}
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
  );
}