// frontend/app/portal-conductor/page.tsx

'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Importar el "Cerebro"
import toast from 'react-hot-toast'; // Para notificaciones

// Tipo para el vehículo asignado
type VehiculoAsignado = {
  id: string;
  patente: string;
  modelo: string;
  año: number;
  tipo_vehiculo: string;
  estado: string;
};

export default function PortalConductorPage() {
  
  // --- HOOKS ---
  const [miVehiculo, setMiVehiculo] = useState<VehiculoAsignado | null>(null);
  const [loadingVehiculo, setLoadingVehiculo] = useState(true);
  
  // Estados para el formulario de solicitud
  const [descripcionFalla, setDescripcionFalla] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- LÓGICA DE PROTECCIÓN Y CARGA DE DATOS ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        
        // --- ¡EL GUARDIA! ---
        if (userProfile.rol === 'Conductor') {
          // 1. ¡PERMITIDO! Carga los datos
          fetchMiVehiculo(userProfile.id); // Pasa el ID del conductor
        } else {
          // 2. ¡NO PERMITIDO! Redirige
          console.warn(`Acceso denegado a /portal-conductor. Rol: ${userProfile.rol}`);
          router.push('/'); 
        }
        // --- FIN DEL GUARDIA ---
        
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // Función para buscar el vehículo del conductor
  const fetchMiVehiculo = async (conductorId: string) => {
    setLoadingVehiculo(true);
    try {
      // Llama a la API que acabamos de crear
      const response = await fetch(`/api/vehiculos/por-conductor/${conductorId}`);
      if (!response.ok) {
        // Si da 404 (No asignado), no es un error, solo no hay vehículo
        if (response.status === 404) {
          setMiVehiculo(null);
        } else {
          throw new Error('No se pudo cargar tu vehículo');
        }
      } else {
        const data = await response.json();
        setMiVehiculo(data);
      }
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoadingVehiculo(false);
    }
  };

  // --- Función para ENVIAR LA SOLICITUD ---
  const handleSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcionFalla) {
      toast.error('Por favor, describe la falla o el motivo.');
      return;
    }
    if (!userProfile || !miVehiculo) {
      toast.error('No se pudo cargar tu perfil o vehículo.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Llama a la API que creamos en el PASO 1 de la propuesta
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_conductor: userProfile.id,
          nombre_conductor: userProfile.nombre,
          patente_vehiculo: miVehiculo.patente,
          descripcion_falla: descripcionFalla,
        }),
      });

      if (!response.ok) {
        throw new Error('Falló el envío de la solicitud');
      }

      toast.success('¡Solicitud enviada exitosamente!');
      setDescripcionFalla(''); // Limpia el formulario

    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LÓGICA DE RETORNO TEMPRANO ---
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }
  if (userProfile.rol !== 'Conductor') {
    return <div className="p-8 text-gray-900">Acceso denegado.</div>;
  }

  // --- RENDERIZADO DE LA PÁGINA ---
  return (
    <div className="p-8 text-gray-900 max-w-4xl mx-auto"> 
      
      <h1 className="text-3xl font-bold mb-6">Portal del Conductor</h1>
      
      {/* --- SECCIÓN 1: MI VEHÍCULO --- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Mi Vehículo Asignado</h2>
        {loadingVehiculo ? (
          <p>Buscando tu vehículo...</p>
        ) : miVehiculo ? (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-500">Patente</span>
              <p className="font-medium text-lg">{miVehiculo.patente}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Modelo</span>
              <p className="font-medium text-lg">{miVehiculo.modelo} ({miVehiculo.año})</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Estado Actual</span>
              <p className={`font-bold text-lg ${
                miVehiculo.estado === 'Activo' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {miVehiculo.estado}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-700">Actualmente no tienes un vehículo asignado en el sistema.</p>
        )}
      </div>

      {/* --- SECCIÓN 2: SOLICITAR MANTENIMIENTO --- */}
      {/* (Solo se muestra si SÍ tiene un vehículo asignado) */}
      {miVehiculo && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Solicitar Mantenimiento</h2>
          <form onSubmit={handleSolicitud} className="space-y-4">
            <div>
              <label htmlFor="descripcionFalla" className="block text-sm font-medium text-gray-700">
                Describe la falla o el mantenimiento requerido:
              </label>
              <textarea
                id="descripcionFalla"
                rows={4}
                value={descripcionFalla}
                onChange={(e) => setDescripcionFalla(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
                placeholder="Ej: Ruido extraño en el motor al frenar, luz de check engine encendida, mantención de 100.000 km..."
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}