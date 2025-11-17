'use client'; 
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast'; 

// (El tipo OrdenDeTrabajo no cambia)
type OrdenDeTrabajo = {
  id: string;
  descripcionProblema: string; 
  estado: 'Agendado' | 'Pendiente' | 'Asignada' | 'En Progreso' | 'Finalizado' | 'Cerrado' | 'Anulado';
  patente: string;
  mecanicoAsignadoId?: string | null; 
};

export default function MisTareasPage() {
  // (Toda la lógica de 'useState', 'useEffect' y 'fetch' queda idéntica)
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
          // Redirección para otros roles (no cambia)
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
      const response = await fetch('/api/ordenes-trabajo');
      if (!response.ok) throw new Error('No se pudieron cargar las órdenes de trabajo');
      const data = await response.json();
      setOrdenes(data); 
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // (La lógica de 'if (loading...)' no cambia)
  if (authLoading || !userProfile || userProfile.rol !== 'Mecánico') {
    return <div className="p-8 font-sans">Validando sesión y permisos...</div>;
  }
  
  // (La lógica de filtrado de 4 columnas no cambia)
  const mecanicoIdActual = userProfile.id;
  const poolTareas = ordenes.filter(ot => ot.estado === 'Pendiente');
  const misAsignadas = ordenes.filter(ot => ot.estado === 'Asignada' && ot.mecanicoAsignadoId === mecanicoIdActual);
  const misEnProgreso = ordenes.filter(ot => ot.estado === 'En Progreso' && ot.mecanicoAsignadoId === mecanicoIdActual);
  const misFinalizadas = ordenes.filter(ot => ot.estado === 'Finalizado' && ot.mecanicoAsignadoId === mecanicoIdActual);

  
  // --- JSX REFACTORIZADO VISUALMENTE ---
  return (
    <div className="p-8 font-sans">
      {/* Título con color Pepsi */}
      <h1 className="text-3xl font-bold text-pepsi-blue">Mi Tablero</h1>
      <p className="text-neutral-700 mb-6">Vista personal de las órdenes de trabajo.</p>
      
      {/* Grid de 4 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Columna 1: El "Pool" (Pendiente) */}
        {/* Tarjeta de columna blanca con sombra */}
        <div className="bg-white shadow-card rounded-lg p-4 flex flex-col">
          <h2 className="font-bold text-xl mb-4 text-pepsi-red">Pool (Pendiente)</h2>
          <div className="space-y-3 overflow-y-auto">
            {loading ? <p>Cargando...</p> : poolTareas.length > 0 ? (
              poolTareas.map(ot => (
                <Link href={`/tareas-detalle/${ot.id}`} key={ot.id}>
                  {/* Tarjeta de Tarea con animación */}
                  <div className="bg-neutral-50 p-3 rounded-lg shadow-sm border border-neutral-100 cursor-pointer 
                                  hover:shadow-card-hover hover:border-pepsi-blue-light 
                                  transition-transform-shadow duration-200 transform hover:-translate-y-1">
                    <p className="font-semibold text-neutral-900">{ot.descripcionProblema}</p>
                    <p className="text-sm text-neutral-700">Patente: {ot.patente}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-neutral-700">No hay tareas pendientes.</p>
            )}
          </div>
        </div>
        
        {/* Columna 2: Mis Tareas Asignadas */}
        <div className="bg-white shadow-card rounded-lg p-4 flex flex-col">
          <h2 className="font-bold text-xl mb-4 text-pepsi-blue-light">Mis Tareas (Asignada)</h2>
          <div className="space-y-3 overflow-y-auto">
             {loading ? <p>Cargando...</p> : misAsignadas.length > 0 ? (
              misAsignadas.map(ot => (
                <Link href={`/tareas-detalle/${ot.id}`} key={ot.id}>
                  {/* Tarjeta de Tarea con animación */}
                  <div className="bg-neutral-50 p-3 rounded-lg shadow-sm border border-neutral-100 cursor-pointer 
                                  hover:shadow-card-hover hover:border-pepsi-blue-light 
                                  transition-transform-shadow duration-200 transform hover:-translate-y-1">
                    <p className="font-semibold text-neutral-900">{ot.descripcionProblema}</p>
                    <p className="text-sm text-neutral-700">Patente: {ot.patente}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-neutral-700">No tienes tareas asignadas.</p>
            )}
          </div>
        </div>
        
        {/* Columna 3: Mis Tareas En Progreso */}
        <div className="bg-white shadow-card rounded-lg p-4 flex flex-col">
          <h2 className="font-bold text-xl mb-4 text-yellow-500">Mis Tareas (En Progreso)</h2>
           <div className="space-y-3 overflow-y-auto">
            {loading ? <p>Cargando...</p> : misEnProgreso.length > 0 ? (
              misEnProgreso.map(ot => (
                <Link href={`/tareas-detalle/${ot.id}`} key={ot.id}>
                  {/* Tarjeta de Tarea con animación */}
                  <div className="bg-neutral-50 p-3 rounded-lg shadow-sm border border-neutral-100 cursor-pointer 
                                  hover:shadow-card-hover hover:border-pepsi-blue-light 
                                  transition-transform-shadow duration-200 transform hover:-translate-y-1">
                    <p className="font-semibold text-neutral-900">{ot.descripcionProblema}</p>
                    <p className="text-sm text-neutral-700">Patente: {ot.patente}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-neutral-700">No tienes tareas en progreso.</p>
            )}
          </div>
        </div>
        
        {/* Columna 4: Mis Tareas Finalizadas */}
        <div className="bg-white shadow-card rounded-lg p-4 flex flex-col">
          <h2 className="font-bold text-xl mb-4 text-green-500">Mis Tareas (Finalizadas)</h2>
           <div className="space-y-3 overflow-y-auto">
            {loading ? <p>Cargando...</p> : misFinalizadas.length > 0 ? (
              misFinalizadas.map(ot => (
                <Link href={`/tareas-detalle/${ot.id}`} key={ot.id}>
                  {/* Tarjeta de Tarea con animación */}
                  <div className="bg-neutral-50 p-3 rounded-lg shadow-sm border border-neutral-100 cursor-pointer 
                                  hover:shadow-card-hover hover:border-pepsi-blue-light 
                                  transition-transform-shadow duration-200 transform hover:-translate-y-1">
                    <p className="font-semibold text-neutral-900">{ot.descripcionProblema}</p>
                    <p className="text-sm text-neutral-700">Patente: {ot.patente}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-neutral-700">No tienes tareas finalizadas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}