// frontend/app/mis-tareas/page.tsx
// (CÓDIGO CORREGIDO: El "Pool" vuelve a ser la columna "Pendiente")

'use client'; 
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast'; 

type OrdenDeTrabajo = {
  id: string;
  descripcionProblema: string; 
  estado: 'Agendado' | 'Pendiente' | 'En Progreso' | 'Finalizado' | 'Cerrado' | 'Anulado';
  patente: string;
  mecanicoAsignadoId?: string | null; 
};

export default function MisTareasPage() {
  const [ordenes, setOrdenes] = useState<OrdenDeTrabajo[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // ... (Protección y Carga - sin cambios) ...
    if (!authLoading) {
      if (user && userProfile) {
        if (userProfile.rol === 'Mecánico') {
          fetchOrdenes();
        } else {
          if (userProfile.rol === 'Jefe de Taller') router.push('/dashboard-admin');
          else if (userProfile.rol === 'Guardia') router.push('/control-acceso');
          else router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchOrdenes = async () => {
    // ... (Carga de Datos - sin cambios) ...
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

  if (authLoading || !userProfile || userProfile.rol !== 'Mecánico') {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  // --- ¡LÓGICA DE FILTRADO (POOL) CORREGIDA! ---
  const mecanicoIdActual = userProfile.id;

  // 1. "Pool" (Pendiente / Sin Asignar):
  const poolTareas = ordenes.filter(ot => 
    ot.estado === 'Pendiente' // <-- CORREGIDO
  );
  
  // 2. "Mis Tareas En Progreso":
  const misTareasEnProgreso = ordenes.filter(ot => 
    ot.estado === 'En Progreso' && ot.mecanicoAsignadoId === mecanicoIdActual
  );
  
  // 3. "Mis Tareas Finalizadas":
  const misFinalizadas = ordenes.filter(ot => 
    ot.estado === 'Finalizado' && ot.mecanicoAsignadoId === mecanicoIdActual
  );
  // --- FIN DE LA LÓGICA ---

  return (
    <div className="p-8 text-gray-900">
      <h1 className="text-3xl font-bold">Mi Tablero</h1>
      <p className="text-gray-600 mb-6">Vista personal de las órdenes de trabajo.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Columna 1: El "Pool" (Pendiente) */}
        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h2 className="font-bold text-xl mb-4 text-red-600">Pool de Tareas (Pendiente)</h2>
          <div className="space-y-3">
            {loading ? <p>Cargando...</p> : poolTareas.length > 0 ? (
              poolTareas.map(ot => (
                <Link href={`/tareas-detalle/${ot.id}`} key={ot.id}>
                  <div className="bg-white p-3 rounded shadow cursor-pointer hover:shadow-md">
                    <p className="font-semibold">{ot.descripcionProblema}</p>
                    <p className="text-sm text-gray-500">Patente: {ot.patente}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500">No hay tareas pendientes en el pool.</p>
            )}
          </div>
        </div>
        
        {/* Columna 2: Mis Tareas En Progreso */}
        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h2 className="font-bold text-xl mb-4 text-yellow-600">Mis Tareas (En Progreso)</h2>
          <div className="space-y-3">
             {loading ? <p>Cargando...</p> : misTareasEnProgreso.length > 0 ? (
              misTareasEnProgreso.map(ot => (
                <Link href={`/tareas-detalle/${ot.id}`} key={ot.id}>
                  <div className="bg-white p-3 rounded shadow cursor-pointer hover:shadow-md">
                    <p className="font-semibold">{ot.descripcionProblema}</p>
                    <p className="text-sm text-gray-500">Patente: {ot.patente}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500">No tienes tareas en progreso.</p>
            )}
          </div>
        </div>
        
        {/* Columna 3: Mis Tareas Finalizadas */}
        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h2 className="font-bold text-xl mb-4 text-green-600">Mis Tareas (Finalizadas)</h2>
           <div className="space-y-3">
            {loading ? <p>Cargando...</p> : misFinalizadas.length > 0 ? (
              misFinalizadas.map(ot => (
                <Link href={`/tareas-detalle/${ot.id}`} key={ot.id}>
                  <div className="bg-white p-3 rounded shadow cursor-pointer hover:shadow-md">
                    <p className="font-semibold">{ot.descripcionProblema}</p>
                    <p className="text-sm text-gray-500">Patente: {ot.patente}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500">No tienes tareas finalizadas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}