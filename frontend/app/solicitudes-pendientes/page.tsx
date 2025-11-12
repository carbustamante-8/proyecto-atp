// frontend/app/solicitudes-pendientes/page.tsx
// (CÓDIGO ACTUALIZADO: Botón "Gestionar" y "Rechazar" funcionando)

'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 

type Solicitud = {
  id: string;
  patente_vehiculo: string;
  nombre_conductor: string;
  descripcion_falla: string;
  fechaCreacion: {
    _seconds: number;
  };
  estado: string;
};

export default function SolicitudesPendientesPage() {
  
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter(); // <-- ¡Necesario para redirigir!

  // --- Estados para el Modal de Rechazo ---
  const [modalAbierto, setModalAbierto] = useState(false);
  const [solicitudParaBorrar, setSolicitudParaBorrar] = useState<Solicitud | null>(null);

  // --- Lógica de Protección y Carga (Sin cambios) ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchSolicitudes();
        } else {
          console.warn(`Acceso denegado. Rol: ${userProfile.rol}`);
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // Función de Carga (Sin cambios)
  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/solicitudes');
      if (!response.ok) {
        const data = await response.json();
        if(data.error) throw new Error(data.error);
        throw new Error('No se pudieron cargar las solicitudes');
      }
      const data = await response.json();
      setSolicitudes(data);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ¡FUNCIÓN "Convertir en OT" CORREGIDA! ---
  const handleConvertirOT = (solicitud: Solicitud) => {
    console.log('Convertir en OT:', solicitud.id);
    
    // 1. Prepara los datos para la URL
    const patente = encodeURIComponent(solicitud.patente_vehiculo);
    const motivo = encodeURIComponent(solicitud.descripcion_falla);
    
    // 2. Redirige al formulario de Crear OT (¡que ya sabe leer estos datos!)
    router.push(`/crear-ot?patente=${patente}&motivo=${motivo}`);
  };

  // --- ¡NUEVA LÓGICA DEL MODAL DE RECHAZO! ---
  const handleAbrirModalRechazar = (solicitud: Solicitud) => {
    setSolicitudParaBorrar(solicitud);
    setModalAbierto(true);
  };
  const handleCerrarModalRechazar = () => {
    setModalAbierto(false);
    setSolicitudParaBorrar(null);
  };
  const handleConfirmarRechazar = async () => {
    if (!solicitudParaBorrar) return;
    try {
      // Llama a la API DELETE que acabamos de crear
      const response = await fetch(`/api/solicitudes?id=${solicitudParaBorrar.id}`, { 
        method: 'DELETE' 
      });
      if (!response.ok) {
         const data = await response.json();
         throw new Error(data.error || 'Error al rechazar');
      }
      // Actualiza la lista en la pantalla
      setSolicitudes(actuales => 
        actuales.filter(s => s.id !== solicitudParaBorrar.id)
      );
      toast.success(`Solicitud de ${solicitudParaBorrar.patente_vehiculo} rechazada.`);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      handleCerrarModalRechazar();
    }
  };

  // --- LÓGICA DE RETORNO TEMPRANO (Sin cambios) ---
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  if (!['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol)) {
    return <div className="p-8 text-gray-900">Acceso denegado.</div>;
  }

  // --- RENDERIZADO DE LA PÁGINA ---
  return (
    <>
      {/* --- MODAL DE CONFIRMACIÓN DE RECHAZO --- */}
      {modalAbierto && solicitudParaBorrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 1. Overlay "Transparente Borroso" */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
            onClick={handleCerrarModalRechazar}
          ></div>
          {/* 2. Caja Blanca (Contenido) */}
          <div className="relative z-10 bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Rechazo</h2>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que quieres rechazar la solicitud de
              <strong className="text-blue-600"> {solicitudParaBorrar.nombre_conductor}</strong> (Patente: {solicitudParaBorrar.patente_vehiculo})?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCerrarModalRechazar}
                className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarRechazar}
                className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 font-medium"
              >
                Sí, Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- FIN DEL MODAL --- */}

      <div className="p-8 text-gray-900"> 
        <h1 className="text-3xl font-bold mb-6">Solicitudes Pendientes</h1>
        <p className="text-gray-600 mb-6">Solicitudes de mantenimiento enviadas por conductores pendientes de aprobación.</p>
        
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Solicitud</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción de la Falla</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              
              {loading && (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando solicitudes...</td></tr>
              )}

              {!loading && solicitudes.length > 0 ? (
                solicitudes.map(req => (
                  <tr key={req.id}>
                    <td className="px-6 py-4">
                      {new Date(req.fechaCreacion._seconds * 1000).toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4 font-medium">{req.patente_vehiculo}</td>
                    <td className="px-6 py-4">{req.nombre_conductor}</td>
                    <td className="px-6 py-4">{req.descripcion_falla}</td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      {/* --- ¡BOTÓN "Gestionar" CONECTADO! --- */}
                      <button 
                        onClick={() => handleConvertirOT(req)}
                        className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
                      >
                        Gestionar / Crear OT
                      </button>
                      {/* --- ¡BOTÓN "Rechazar" AÑADIDO! --- */}
                      <button 
                        onClick={() => handleAbrirModalRechazar(req)}
                        className="bg-red-600 text-white px-3 py-1 rounded shadow hover:bg-red-700"
                      >
                        Rechazar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                !loading && solicitudes.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-4 text-center">No hay solicitudes pendientes.</td></tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}