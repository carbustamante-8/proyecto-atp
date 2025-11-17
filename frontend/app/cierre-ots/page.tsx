'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

// --- ¡NUEVO! Icono para el botón ---
import { ArrowRightIcon } from '@heroicons/react/24/outline';

// (El tipo de dato no cambia)
type OTFinalizada = {
  id: string;
  patente: string;
  mecanicoAsignadoNombre: string;
  fechaCompletado?: { _seconds: number };
  descripcionProblema: string;
  estado: string;
};

export default function CierreOTsPage() {
  
  // (Toda la lógica de 'useState', 'useEffect' y 'fetch' queda idéntica)
  const [otsFinalizadas, setOtsFinalizadas] = useState<OTFinalizada[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        // Roles que pueden ver esta página
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchOTsFinalizadas();
        } else {
          toast.error('Acceso denegado');
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchOTsFinalizadas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo');
      if (!response.ok) throw new Error('No se pudieron cargar las OTs');
      const data: OTFinalizada[] = await response.json();
      
      const finalizadas = data
        .filter(ot => ot.estado === 'Finalizado')
        .sort((a, b) => (a.fechaCompletado?._seconds || 0) - (b.fechaCompletado?._seconds || 0)); // Más antiguas primero
        
      setOtsFinalizadas(finalizadas);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 font-sans">Validando sesión y cargando OTs...</div>;
  }

  // --- JSX REFACTORIZADO VISUALMENTE ---
  return (
    <div className="p-8 font-sans">
      
      {/* Título con color Pepsi */}
      <h1 className="text-3xl font-bold text-pepsi-blue mb-6">OTs Pendientes de Cierre</h1>
      <p className="text-neutral-700 mb-8 -mt-4">
        Las siguientes OTs han sido marcadas como "Finalizadas" por los mecánicos y requieren revisión administrativa.
      </p>

      {otsFinalizadas.length > 0 ? (
        <div className="space-y-4">
          {otsFinalizadas.map(ot => (
            
            // --- Tarjeta de OT (Rediseñada) ---
            <div 
              key={ot.id}
              // Tarjeta blanca con sombra y animación de hover
              className="bg-white shadow-card rounded-lg p-6 flex flex-col md:flex-row justify-between md:items-center
                         transition-transform-shadow duration-200 transform hover:-translate-y-1 hover:shadow-card-hover"
            >
              {/* Información de la OT */}
              <div className="mb-4 md:mb-0">
                <p className="text-sm text-neutral-700">Patente</p>
                <h2 className="text-xl font-bold text-neutral-900">{ot.patente}</h2>
                <p className="text-sm text-neutral-700 mt-2">
                  Finalizada por: <span className="font-medium">{ot.mecanicoAsignadoNombre || 'Taller'}</span>
                </p>
                <p className="text-sm text-neutral-700">
                  Motivo: <span className="italic">{ot.descripcionProblema}</span>
                </p>
              </div>
              
              {/* Botón de Acción (Pepsi) */}
              <Link 
                href={`/tareas-detalle/${ot.id}`}
                className="inline-flex items-center justify-center gap-2 bg-pepsi-blue text-white px-5 py-2 rounded-lg shadow font-medium 
                           hover:bg-pepsi-blue-dark transition-colors duration-200"
              >
                Revisar y Cerrar
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        // Mensaje si no hay OTs pendientes
        <div className="bg-white rounded-lg shadow-card p-8 text-center">
          <h2 className="text-xl font-bold text-neutral-900">Bandeja Limpia</h2>
          <p className="text-neutral-700 mt-2">No hay OTs finalizadas pendientes de cierre.</p>
        </div>
      )}
    </div>
  );
}