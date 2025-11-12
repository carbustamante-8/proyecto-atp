// frontend/app/solicitudes-pendientes/page.tsx
// (CÓDIGO ACTUALIZADO: Ahora es la "Bandeja de Taller" unificada)

'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 

// --- Tipos de Datos ---
type Solicitud = {
  id: string;
  patente_vehiculo: string;
  nombre_conductor: string;
  descripcion_falla: string;
  fechaCreacion: { _seconds: number };
  estado: string;
};

type IngresoGuardia = {
  id: string;
  patente: string;
  chofer: string;
  motivoIngreso: string;
  fechaIngreso: { _seconds: number };
};
// --- Fin Tipos ---

// Renombramos el componente para que coincida con su nueva función
export default function BandejaDeTallerPage() {
  
  // --- Estados para AMBAS listas ---
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [ingresos, setIngresos] = useState<IngresoGuardia[]>([]);
  
  const [loading, setLoading] = useState(true);
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- Lógica de Protección y Carga ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        // Solo los Admins pueden ver esta bandeja
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          // Carga ambas listas de pendientes
          fetchAllPendientes();
        } else {
          router.push('/'); // Redirige a otros roles
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // --- ¡NUEVA FUNCIÓN DE CARGA! ---
  // Carga ambas listas de entradas pendientes al mismo tiempo
  const fetchAllPendientes = async () => {
    setLoading(true);
    try {
      // 1. Carga Solicitudes (de Conductores)
      const fetchSolicitudes = fetch('/api/solicitudes').then(res => res.json());
      // 2. Carga Ingresos (de Guardia)
      const fetchIngresos = fetch('/api/registros-acceso').then(res => res.json());

      const [solicitudesData, ingresosData] = await Promise.all([
        fetchSolicitudes,
        fetchIngresos
      ]);

      // Filtra solo las solicitudes 'Pendientes'
      setSolicitudes(solicitudesData.filter((s: any) => s.estado === 'Pendiente'));
      // La API de registros-acceso ya filtra los ingresos abiertos (sin fechaSalida)
      setIngresos(ingresosData); 

    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Acciones de los Botones ---

  // 1. Convertir Solicitud o Ingreso en OT
  // (Esta función ahora es genérica)
  const handleCrearOT = (tipo: 'solicitud' | 'ingreso', data: Solicitud | IngresoGuardia) => {
    let patente = '';
    let motivo = '';

    if (tipo === 'solicitud') {
      const s = data as Solicitud;
      patente = s.patente_vehiculo;
      motivo = s.descripcion_falla;
    } else {
      const i = data as IngresoGuardia;
      patente = i.patente;
      motivo = i.motivoIngreso;
    }
    
    toast.success('Redirigiendo para crear OT...');
    // Redirige al formulario de crear OT (que ya está simplificado)
    router.push(`/crear-ot?patente=${encodeURIComponent(patente)}&motivo=${encodeURIComponent(motivo)}`);
  };

  // 2. Rechazar Solicitud (solo para Solicitudes Digitales)
  const handleRechazarSolicitud = async (solicitud: Solicitud) => {
    // Usamos un modal simple de navegador
    if (!confirm(`¿Estás seguro de que quieres rechazar la solicitud de ${solicitud.patente_vehiculo}?`)) {
      return;
    }
    try {
      // Llama a la API DELETE que ya existe
      const response = await fetch(`/api/solicitudes?id=${solicitud.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al rechazar');
      // Actualiza la lista en la pantalla
      setSolicitudes(actuales => actuales.filter(s => s.id !== solicitud.id));
      toast.success('Solicitud rechazada.');
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    }
  };
  
  // --- Lógica de Renderizado Temprano ---
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  return (
    // Usamos 'space-y-12' para separar las dos tablas
    <div className="p-8 text-gray-900 space-y-12"> 
      
      <h1 className="text-3xl font-bold">Bandeja de Taller</h1>
      
      {/* --- 1. SOLICITUDES DIGITALES (De Conductores) --- */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Entradas: Solicitudes Digitales (Conductores)</h2>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Solicitud</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando...</td></tr>
              ) : solicitudes.length > 0 ? (
                solicitudes.map(req => (
                  <tr key={req.id}>
                    <td className="px-6 py-4">{new Date(req.fechaCreacion._seconds * 1000).toLocaleString('es-CL')}</td>
                    <td className="px-6 py-4 font-medium">{req.patente_vehiculo}</td>
                    <td className="px-6 py-4">{req.nombre_conductor}</td>
                    <td className="px-6 py-4">{req.descripcion_falla}</td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button 
                        onClick={() => handleCrearOT('solicitud', req)}
                        className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
                      >
                        Crear OT
                      </button>
                      <button 
                        onClick={() => handleRechazarSolicitud(req)}
                        className="bg-red-600 text-white px-3 py-1 rounded shadow hover:bg-red-700"
                      >
                        Rechazar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-4 text-center">No hay solicitudes digitales pendientes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- 2. INGRESOS FÍSICOS (De Guardia) --- */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Entradas: Ingresos Físicos (Guardia)</h2>
        <p className="text-gray-600 mb-4 -mt-3 text-sm">Vehículos que ya están en el patio, reportados por el Guardia.</p>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Ingreso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chofer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo Ingreso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando...</td></tr>
              ) : ingresos.length > 0 ? (
                ingresos.map(reg => (
                  <tr key={reg.id}>
                    <td className="px-6 py-4">{new Date(reg.fechaIngreso._seconds * 1000).toLocaleString('es-CL')}</td>
                    <td className="px-6 py-4 font-medium">{reg.patente}</td>
                    <td className="px-6 py-4">{reg.chofer}</td>
                    <td className="px-6 py-4">{reg.motivoIngreso}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button 
                        onClick={() => handleCrearOT('ingreso', reg)}
                        className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
                      >
                        Crear OT
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-4 text-center">No hay ingresos físicos pendientes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}