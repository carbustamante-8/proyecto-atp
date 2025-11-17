'use client';
import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

// --- ¡NUEVO! Iconos para la UI ---
import { 
  CalendarIcon, 
  PhotoIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

// (Tipo de dato de la solicitud)
type Solicitud = {
  id: string;
  patente: string;
  nombre_conductor: string;
  id_conductor: string;
  descripcionProblema: string;
  estado: string;
  fechaCreacion: { _seconds: number };
  fotoUrl?: string;
};

export default function SolicitudesPendientesPage() {
  
  // (Lógica de 'useState' y 'useRouter' no cambia)
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null); // ¡NUEVO! Para el modal

  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- ¡NUEVO! Auth Check (basado en la documentación) ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchSolicitudes();
        } else {
          toast.error('Acceso denegado');
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/solicitudes');
      if (!response.ok) throw new Error('No se pudieron cargar las solicitudes');
      const data: Solicitud[] = await response.json();
      
      // Filtramos solo las 'Ingresado' (nuevas) y ordenamos
      const pendientes = data
        .filter(s => s.estado === 'Ingresado')
        .sort((a, b) => a.fechaCreacion._seconds - b.fechaCreacion._seconds); // Más antiguas primero
        
      setSolicitudes(pendientes);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 font-sans">Validando sesión y cargando solicitudes...</div>;
  }

  // --- JSX REFACTORIZADO VISUALMENTE ---
  return (
    <Fragment>
      {/* --- Modal de Foto Ampliada (Estilo v3) --- */}
      {fotoAmpliada && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
            <Image 
              src={fotoAmpliada} 
              alt="Evidencia ampliada"
              layout="fill"
              objectFit="contain"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
          <button
            onClick={() => setFotoAmpliada(null)}
            className="absolute top-4 right-4 bg-white text-neutral-900 rounded-full w-10 h-10 shadow-lg
                       flex items-center justify-center hover:bg-neutral-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* --- Contenedor Principal de la Página --- */}
      <div className="p-8 font-sans">
        
        {/* Título con color Pepsi */}
        <h1 className="text-3xl font-bold text-pepsi-blue mb-6">Bandeja de Taller (Solicitudes Pendientes)</h1>
        
        {solicitudes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solicitudes.map(solicitud => (
              
              // --- Tarjeta de Solicitud (Rediseñada) ---
              <div 
                key={solicitud.id} 
                // Añadimos la animación de hover
                className="bg-white rounded-lg shadow-card p-6 flex flex-col justify-between 
                           transition-transform-shadow duration-200 transform hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div>
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-xl text-neutral-900">{solicitud.patente}</span>
                    <span className="text-xs text-neutral-700">
                      {new Date(solicitud.fechaCreacion._seconds * 1000).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 mb-4">
                    Por: <span className="font-medium">{solicitud.nombre_conductor}</span>
                  </p>
                  
                  {/* Foto (si existe) */}
                  {solicitud.fotoUrl && (
                    <div 
                      className="relative w-full h-40 rounded-md overflow-hidden mb-4 border border-neutral-100 cursor-pointer"
                      // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
                      // Añadimos '|| null' para satisfacer a TypeScript
                      onClick={() => setFotoAmpliada(solicitud.fotoUrl || null)}
                    >
                      <Image src={solicitud.fotoUrl} alt="Foto de evidencia" layout="fill" objectFit="cover" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-opacity duration-200">
                        <PhotoIcon className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )}

                  {/* Descripción del Problema */}
                  <p className="text-sm text-neutral-900 mb-4">{solicitud.descripcionProblema}</p>
                </div>
                
                {/* Botón de Acción (Preserva la lógica del Link) */}
                <Link 
                  href={{
                    pathname: '/crear-ot',
                    query: { 
                      patente: solicitud.patente, 
                      motivo: solicitud.descripcionProblema,
                      id_conductor: solicitud.id_conductor,
                      nombre_conductor: solicitud.nombre_conductor,
                      solicitud_id: solicitud.id
                    }
                  }}
                  className="mt-4"
                >
                  <span className="inline-flex items-center justify-center gap-2 w-full bg-pepsi-blue text-white px-4 py-2 
                                 rounded-md shadow font-medium hover:bg-pepsi-blue-dark transition-colors duration-200 cursor-pointer"
                  >
                    <CalendarIcon className="h-5 w-5" />
                    Agendar OT
                  </span>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          // Mensaje si no hay solicitudes
          <div className="bg-white rounded-lg shadow-card p-8 text-center">
            <h2 className="text-xl font-bold text-neutral-900">Bandeja Limpia</h2>
            <p className="text-neutral-700 mt-2">No hay nuevas solicitudes de conductores pendientes de agendar.</p>
          </div>
        )}
      </div>
    </Fragment>
  );
}