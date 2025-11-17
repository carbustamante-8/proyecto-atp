// frontend/app/mis-tareas/page.tsx
// (CÓDIGO ACTUALIZADO: DISEÑO PEPSI Y ALINEACIÓN)

'use client'; 
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast'; 
import { HomeModernIcon } from '@heroicons/react/24/outline'; // Icono para el título

type OrdenDeTrabajo = {
  id: string;
  descripcionProblema: string; 
  estado: 'Agendado' | 'Pendiente' | 'Asignada' | 'En Progreso' | 'Finalizado' | 'Cerrado' | 'Anulado';
  patente: string;
  mecanicoAsignadoId?: string | null; 
};

// Componente Tarjeta de Tarea estilizado
const TaskCard = ({ ot }: { ot: OrdenDeTrabajo }) => (
    <Link href={`/tareas-detalle/${ot.id}`} key={ot.id}>
        <div className="bg-white p-4 rounded-lg shadow-card-hover cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4 border-pepsi-blue">
            <p className="font-bold text-lg text-neutral-900">{ot.patente}</p>
            <p className="text-sm text-neutral-700 mt-1 line-clamp-2">{ot.descripcionProblema}</p>
        </div>
    </Link>
);

export default function MisTareasPage() {
  const [ordenes, setOrdenes] = useState<OrdenDeTrabajo[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        if (userProfile.rol === 'Mecánico') {
          fetchOrdenes();
        } else {
          // Redirección para otros roles
          if (userProfile.rol === 'Jefe de Taller') router.push('/agenda-taller');
          else if (userProfile.rol === 'Supervisor') router.push('/dashboard-admin');
          else if (userProfile.rol === 'Coordinador') router.push('/dashboard-admin');
          else if (userProfile.rol === 'Guardia') router.push('/control-acceso');
          else if (userProfile.rol === 'Conductor') router.push('/portal-conductor');
          else if (userProfile.rol === 'Gerente') router.push('/generador-reportes');
          else router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      // Trae solo las OTs asignadas, en progreso o finalizadas para este mecánico (eficiente)
      const response = await fetch(`/api/ordenes-trabajo?mecanicoId=${userProfile?.id}`);
      if (!response.ok) throw new Error('No se pudieron cargar las órdenes de trabajo');
      const data = await response.json();
      setOrdenes(data); 
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !userProfile || userProfile.rol !== 'Mecánico') {
    return <div className="p-8 text-neutral-900">Validando sesión y permisos...</div>;
  }
  
  const mecanicoIdActual = userProfile.id;

  // Filtrado de tareas (optimizado por la consulta API, pero filtrado final aquí)
  const misAsignadas = ordenes.filter(ot => 
    ot.estado === 'Asignada' && ot.mecanicoAsignadoId === mecanicoIdActual
  );
  
  const misEnProgreso = ordenes.filter(ot => 
    ot.estado === 'En Progreso' && ot.mecanicoAsignadoId === mecanicoIdActual
  );
  
  const misFinalizadas = ordenes.filter(ot => 
    ot.estado === 'Finalizado' && ot.mecanicoAsignadoId === mecanicoIdActual
  );
  
  // (El pool general de "Pendientes" requeriría una llamada a /api/ordenes-trabajo sin filtro, 
  // pero solo mostramos tareas del mecánico para mantener la eficiencia de la API anterior)
  // Dejaremos la columna Pool vacía o pendiente para no reintroducir fallos.

  return (
    <div className="p-8 text-neutral-900">
      
      <h1 className="text-3xl font-bold text-pepsi-blue flex items-center gap-3 mb-2">
        <HomeModernIcon className="h-7 w-7"/>
        Mi Tablero de Tareas
      </h1>
      <p className="text-gray-600 mb-8">Vista de las órdenes de trabajo asignadas a {userProfile.nombre}.</p>
      
      {loading ? (
          <div className="text-center p-12 text-lg">Cargando tareas...</div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Columna 1: Asignadas (Pendientes de iniciar) */}
            <div className="bg-neutral-50 p-4 rounded-lg shadow-inner">
              <h2 className="font-extrabold text-xl mb-4 text-pepsi-blue uppercase border-b-2 border-pepsi-blue pb-2">
                Asignadas ({misAsignadas.length})
              </h2>
              <div className="space-y-4">
                {misAsignadas.length > 0 ? (
                  misAsignadas.map(ot => <TaskCard key={ot.id} ot={ot} />)
                ) : (
                  <p className="text-gray-500 p-3 bg-white rounded-md text-sm">No tienes tareas asignadas. Espera la cola del supervisor.</p>
                )}
              </div>
            </div>
            
            {/* Columna 2: En Progreso */}
            <div className="bg-neutral-50 p-4 rounded-lg shadow-inner">
              <h2 className="font-extrabold text-xl mb-4 text-yellow-600 uppercase border-b-2 border-yellow-600 pb-2">
                En Progreso ({misEnProgreso.length})
              </h2>
               <div className="space-y-4">
                {misEnProgreso.length > 0 ? (
                  misEnProgreso.map(ot => <TaskCard key={ot.id} ot={ot} />)
                ) : (
                  <p className="text-gray-500 p-3 bg-white rounded-md text-sm">No hay tareas en este momento.</p>
                )}
              </div>
            </div>
            
            {/* Columna 3: Finalizadas (Pendientes de Cierre Admin) */}
            <div className="bg-neutral-50 p-4 rounded-lg shadow-inner">
              <h2 className="font-extrabold text-xl mb-4 text-green-600 uppercase border-b-2 border-green-600 pb-2">
                Finalizadas ({misFinalizadas.length})
              </h2>
               <div className="space-y-4">
                {misFinalizadas.length > 0 ? (
                  misFinalizadas.map(ot => <TaskCard key={ot.id} ot={ot} />)
                ) : (
                  <p className="text-gray-500 p-3 bg-white rounded-md text-sm">Ninguna tarea pendiente de cierre.</p>
                )}
              </div>
            </div>
            
          </div>
      )}
    </div>
  );
}