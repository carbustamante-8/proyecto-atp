// frontend/app/mis-tareas/page.tsx
'use client'; 
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';


type OrdenDeTrabajo = {
  id: string;
  descripcionProblema: string; 
  estado: 'Pendiente' | 'En Progreso' | 'Finalizado';
  patente: string;
};

export default function MisTareasPage() {
  const [ordenes, setOrdenes] = useState<OrdenDeTrabajo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        if (userProfile.rol === 'Mecánico') {
          fetchOrdenes();
        } else {
          console.warn(`Acceso denegado a /mis-tareas. Rol: ${userProfile.rol}`);
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
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo');
      if (!response.ok) throw new Error('No se pudieron cargar las órdenes de trabajo');
      const data = await response.json();
      setOrdenes(data); 
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  if (userProfile.rol !== 'Mecánico') {
    return <div className="p-8 text-gray-900">Acceso denegado.</div>;
  }

  const pendientes = ordenes.filter(ot => ot.estado === 'Pendiente');
  const enProgreso = ordenes.filter(ot => ot.estado === 'En Progreso');
  const finalizadas = ordenes.filter(ot => ot.estado === 'Finalizado');

  return (
    <div className="p-8 text-gray-900">
      <h1 className="text-3xl font-bold">Mi Tablero</h1>
      <p className="text-gray-600 mb-6">Vista personal de las órdenes de trabajo asignadas</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Pendientes */}
        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h2 className="font-bold text-xl mb-4 text-red-600">Pendientes</h2>
          <div className="space-y-3">
            {loading ? <p>Cargando...</p> : pendientes.length > 0 ? (
              pendientes.map(ot => (
                <Link href={`/tareas-detalle/${ot.id}`} key={ot.id}>
                  <div className="bg-white p-3 rounded shadow cursor-pointer hover:shadow-md">
                    <p className="font-semibold">{ot.descripcionProblema}</p>
                    <p className="text-sm text-gray-500">Patente: {ot.patente}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500">No hay tareas pendientes.</p>
            )}
          </div>
        </div>
        {/* Columna En Progreso */}
        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h2 className="font-bold text-xl mb-4 text-yellow-600">En Progreso</h2>
          <div className="space-y-3">
             {loading ? <p>Cargando...</p> : enProgreso.length > 0 ? (
              enProgreso.map(ot => (
                <Link href={`/tareas-detalle/${ot.id}`} key={ot.id}>
                  <div className="bg-white p-3 rounded shadow cursor-pointer hover:shadow-md">
                    <p className="font-semibold">{ot.descripcionProblema}</p>
                    <p className="text-sm text-gray-500">Patente: {ot.patente}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500">No hay tareas en progreso.</p>
            )}
          </div>
        </div>
        {/* Columna Finalizadas */}
        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h2 className="font-bold text-xl mb-4 text-green-600">Finalizadas Hoy</h2>
           <div className="space-y-3">
            {loading ? <p>Cargando...</p> : finalizadas.length > 0 ? (
              finalizadas.map(ot => (
                <Link href={`/tareas-detalle/${ot.id}`} key={ot.id}>
                  <div className="bg-white p-3 rounded shadow cursor-pointer hover:shadow-md">
                    <p className="font-semibold">{ot.descripcionProblema}</p>
                    <p className="text-sm text-gray-500">Patente: {ot.patente}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500">No hay tareas finalizadas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}