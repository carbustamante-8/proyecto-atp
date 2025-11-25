// frontend/app/agenda-taller/page.tsx
// (CÓDIGO VISUALMENTE REFACTORIZADO)

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

// (Los tipos de datos OT y Mecanico no cambian)
type OT = {
  id: string;
  patente: string;
  fecha_ingreso: string; // Asumimos string
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
  // (Toda la lógica de 'useState', 'useEffect' y 'useRouter' queda idéntica)
  const [ots, setOts] = useState<OT[]>([]);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Supervisor', 'Jefe de Taller','Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchOTs();
          fetchMecanicos();
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
  
  const fetchMecanicos = async () => {
    // Lógica para cargar mecánicos (no cambia)
  };
  
  // (La lógica de 'filtrarOTs' no cambia)
  const filtrarOTs = (estado: 'Pendiente' | 'Asignada' | 'En Progreso') => {
    return ots.filter(ot => ot.estado === estado);
  };

  if (authLoading || loading) {
    return <div className="p-8 text-gray-900">Validando sesión y cargando agenda...</div>;
  }

  return (
    // --- ¡PÁGINA REFACTORIZADA! ---
    <div className="p-8 text-gray-900">
      
      {/* Título usa el color pepsi-blue */}
      <h1 className="text-3xl font-bold text-pepsi-blue mb-6">Bandeja de Taller (Agenda)</h1>

      {/* Contenedor de las columnas (Kanban) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* --- COLUMNA 1: Pendientes de Asignar --- */}
        {/* La columna ahora es una "tarjeta" blanca */}
        <div className="bg-white shadow-lg rounded-lg p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Pendientes de Asignar</h2>
          <div className="space-y-4">
            {filtrarOTs('Pendiente').map(ot => (
              // Tarjeta de Tarea
              <div key={ot.id} className="bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200">
                <span className="font-bold text-lg text-gray-900">{ot.patente}</span>
                <p className="text-sm text-gray-600">{ot.tipo_mantencion}</p>
                <p className="text-sm text-gray-600">Ingreso: {ot.fecha_ingreso} {ot.hora_ingreso}</p>
                <Link href={`/tareas-detalle/${ot.id}`}>
                  {/* Botón estandarizado con color pepsi-blue */}
                  <span className="block w-full text-center mt-4 px-4 py-2 rounded-md text-white bg-pepsi-blue hover:bg-blue-700 font-medium cursor-pointer">
                    Asignar
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* --- COLUMNA 2: Tareas Asignadas --- */}
        {/* La columna ahora es una "tarjeta" blanca */}
        <div className="bg-white shadow-lg rounded-lg p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Tareas Asignadas</h2>
          <div className="space-y-4">
            {filtrarOTs('Asignada').map(ot => (
              // Tarjeta de Tarea
              <div key={ot.id} className="bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200">
                <span className="font-bold text-lg text-gray-900">{ot.patente}</span>
                <p className="text-sm text-gray-600">{ot.tipo_mantencion}</p>
                {/* Mostramos al mecánico asignado */}
                <p className="text-sm font-semibold text-pepsi-blue">{ot.mecanico_asignado_nombre || 'Asignado'}</p>
                <Link href={`/tareas-detalle/${ot.id}`}>
                  {/* Botón estandarizado (secundario) */}
                  <span className="block w-full text-center mt-4 px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium cursor-pointer">
                    Ver Detalle
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* --- COLUMNA 3: En Progreso --- */}
        {/* La columna ahora es una "tarjeta" blanca */}
        <div className="bg-white shadow-lg rounded-lg p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">En Progreso</h2>
          <div className="space-y-4">
            {filtrarOTs('En Progreso').map(ot => (
              // Tarjeta de Tarea
              <div key={ot.id} className="bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200">
                <span className="font-bold text-lg text-gray-900">{ot.patente}</span>
                <p className="text-sm text-gray-600">{ot.tipo_mantencion}</p>
                {/* Mostramos al mecánico asignado */}
                <p className="text-sm font-semibold text-pepsi-blue">{ot.mecanico_asignado_nombre || 'En Taller'}</p>
                <Link href={`/tareas-detalle/${ot.id}`}>
                  {/* Botón estandarizado (secundario) */}
                  <span className="block w-full text-center mt-4 px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium cursor-pointer">
                    Ver Detalle
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}