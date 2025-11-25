// frontend/app/agenda-taller/page.tsx
// (CÓDIGO ACTUALIZADO: Sin referencias a evidencia en las tarjetas)

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Tipos
type OT = {
  id: string;
  patente: string;
  fecha_ingreso: string; 
  hora_ingreso: string;
  estado: 'Pendiente' | 'Asignada' | 'En Progreso';
  mecanico_asignado_id?: string;
  mecanico_asignado_nombre?: string;
  tipo_mantencion: string;
};
type Mecanico = {
  id: string;
  nombre: string;
  apellido: string;
};

export default function AgendaTallerPage() {
  const [ots, setOts] = useState<OT[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        // Roles permitidos para ver la agenda
        const rolesPermitidos = ['Supervisor', 'Jefe de Taller', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchOTs();
        } else {
          toast.error('Acceso denegado');
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchOTs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo');
      if (!response.ok) throw new Error('No se pudieron cargar las órdenes');
      const data: OT[] = await response.json();
      // Filtramos solo las activas
      setOts(data.filter(ot => 
        ot.estado === 'Pendiente' || 
        ot.estado === 'Asignada' || 
        ot.estado === 'En Progreso'
      ));
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtrarOTs = (estado: 'Pendiente' | 'Asignada' | 'En Progreso') => {
    return ots.filter(ot => ot.estado === estado);
  };

  if (authLoading || loading) {
    return <div className="p-8 text-gray-900">Cargando agenda...</div>;
  }

  return (
    <div className="p-8 text-gray-900 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-pepsi-blue mb-6">Bandeja de Taller (Agenda)</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* --- COLUMNA 1: Pendientes --- */}
        <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Pendientes de Asignar</h2>
          <div className="space-y-4">
            {filtrarOTs('Pendiente').map(ot => (
              <div key={ot.id} className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <span className="font-bold text-lg text-gray-900">{ot.patente}</span>
                    <span className="text-xs font-medium bg-red-200 text-red-800 px-2 py-1 rounded">Pendiente</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{ot.tipo_mantencion}</p>
                <p className="text-xs text-gray-500 mt-2">Ingreso: {ot.fecha_ingreso}</p>
                
                <Link href={`/tareas-detalle/${ot.id}`}>
                  <span className="block w-full text-center mt-4 px-4 py-2 rounded-md text-white bg-pepsi-blue hover:bg-blue-700 font-medium cursor-pointer transition-colors">
                    Asignar Mecánico
                  </span>
                </Link>
              </div>
            ))}
            {filtrarOTs('Pendiente').length === 0 && <p className="text-sm text-gray-400 italic">No hay pendientes.</p>}
          </div>
        </div>

        {/* --- COLUMNA 2: Asignadas --- */}
        <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Tareas Asignadas</h2>
          <div className="space-y-4">
            {filtrarOTs('Asignada').map(ot => (
              <div key={ot.id} className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <span className="font-bold text-lg text-gray-900">{ot.patente}</span>
                    <span className="text-xs font-medium bg-blue-200 text-blue-800 px-2 py-1 rounded">Asignada</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{ot.tipo_mantencion}</p>
                <p className="text-sm font-semibold text-pepsi-blue mt-2">
                    Mecánico: {ot.mecanico_asignado_nombre || 'Sin Nombre'}
                </p>
                
                <Link href={`/tareas-detalle/${ot.id}`}>
                  <span className="block w-full text-center mt-4 px-4 py-2 rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-medium cursor-pointer transition-colors">
                    Ver Detalle
                  </span>
                </Link>
              </div>
            ))}
            {filtrarOTs('Asignada').length === 0 && <p className="text-sm text-gray-400 italic">No hay tareas asignadas.</p>}
          </div>
        </div>

        {/* --- COLUMNA 3: En Progreso --- */}
        <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">En Progreso</h2>
          <div className="space-y-4">
            {filtrarOTs('En Progreso').map(ot => (
              <div key={ot.id} className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <span className="font-bold text-lg text-gray-900">{ot.patente}</span>
                    <span className="text-xs font-medium bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Trabajando</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{ot.tipo_mantencion}</p>
                <p className="text-sm font-semibold text-pepsi-blue mt-2">
                    Mecánico: {ot.mecanico_asignado_nombre || 'Desconocido'}
                </p>
                
                <Link href={`/tareas-detalle/${ot.id}`}>
                  <span className="block w-full text-center mt-4 px-4 py-2 rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-medium cursor-pointer transition-colors">
                    Ver Avance
                  </span>
                </Link>
              </div>
            ))}
            {filtrarOTs('En Progreso').length === 0 && <p className="text-sm text-gray-400 italic">No hay trabajos en curso.</p>}
          </div>
        </div>
        
      </div>
    </div>
  );
}