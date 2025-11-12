// frontend/app/pendientes-diagnostico/page.tsx
// (CÓDIGO ACTUALIZADO: Separa las vistas para Jefe de Taller y Supervisor)

'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; 

// --- Tipos de Datos (Actualizados) ---
type Solicitud = {
  id: string;
  patente_vehiculo: string;
  nombre_conductor: string;
  descripcion_falla: string;
  fechaCreacion: { _seconds: number };
};

type IngresoGuardia = {
  id: string;
  patente: string;
  chofer: string;
  motivoIngreso: string;
  fechaIngreso: { _seconds: number };
};

type OrdenDeTrabajo = {
  id: string;
  patente: string;
  descripcionProblema: string;
  fechaCreacion: { _seconds: number };
  estado: string;
  // ¡Importante para la tabla del Supervisor!
  mecanicoAsignadoNombre?: string | null; 
};

export default function PendientesDiagnosticoPage() {
  
  // --- Estados para las CUATRO listas ---
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [ingresos, setIngresos] = useState<IngresoGuardia[]>([]);
  // Lista para el Jefe de Taller (CU-04)
  const [otsPendientesDiagnostico, setOtsPendientesDiagnostico] = useState<OrdenDeTrabajo[]>([]);
  // ¡NUEVA LISTA! Para el Supervisor (CU-06)
  const [otsPendientesAprobacion, setOtsPendientesAprobacion] = useState<OrdenDeTrabajo[]>([]);
  
  const [loading, setLoading] = useState(true);
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- Lógica de Protección y Carga ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchAllPendientes();
        } else {
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // --- Función Principal de Carga (Actualizada) ---
  const fetchAllPendientes = async () => {
    setLoading(true);
    try {
      const [solicitudesRes, ingresosRes, otsRes] = await Promise.all([
        fetch('/api/solicitudes'),
        fetch('/api/registros-acceso'),
        fetch('/api/ordenes-trabajo') // Trae TODAS las OTs
      ]);

      const solicitudesData = (await solicitudesRes.json()) as Solicitud[];
      const ingresosData = (await ingresosRes.json()) as IngresoGuardia[];
      const otsData = (await otsRes.json()) as OrdenDeTrabajo[];

      setSolicitudes(solicitudesData.filter((s: any) => s.estado === 'Pendiente'));
      setIngresos(ingresosData); 
      
      // --- ¡LÓGICA DE FILTRADO SEPARADA! ---
      // 1. Para el Jefe de Taller (CU-04)
      setOtsPendientesDiagnostico(
        otsData.filter((ot) => ot.estado === 'Pendiente Diagnóstico')
      );
      // 2. Para el Supervisor (CU-06)
      setOtsPendientesAprobacion(
        otsData.filter((ot) => ot.estado === 'Pendiente Aprobación')
      );
      // --- Fin de la lógica ---

    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Acciones de los Botones ---

  // 1. Convertir Solicitud o Ingreso en OT (sin cambios)
  const handleCrearOT = (tipo: 'solicitud' | 'ingreso', data: Solicitud | IngresoGuardia) => {
    let patente = '';
    let motivo = '';
    if (tipo === 'solicitud') {
      const s = data as Solicitud;
      patente = s.patente_vehiculo; motivo = s.descripcion_falla;
    } else {
      const i = data as IngresoGuardia;
      patente = i.patente; motivo = i.motivoIngreso;
    }
    toast.success('Redirigiendo para crear OT...');
    router.push(`/crear-ot?patente=${encodeURIComponent(patente)}&motivo=${encodeURIComponent(motivo)}`);
  };

  // 2. Ir a Gestionar (Diagnosticar o Aprobar)
  // Esta función ahora la usan AMBOS, Jefe y Supervisor
  const handleGestionarOT = (otId: string) => {
    router.push(`/tareas-detalle/${otId}`);
  };

  // 3. Rechazar Solicitud (sin cambios)
  const handleRechazarSolicitud = async (solicitud: Solicitud) => {
    if (!confirm(`¿Rechazar solicitud de ${solicitud.patente_vehiculo}?`)) return;
    try {
      await fetch(`/api/solicitudes?id=${solicitud.id}`, { method: 'DELETE' });
      setSolicitudes(actuales => actuales.filter(s => s.id !== solicitud.id));
      toast.success('Solicitud rechazada.');
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    }
  };
  
  // --- Lógica de Renderizado ---
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }
  
  // Variables de rol para un JSX más limpio
  const esJefeDeTaller = userProfile.rol === 'Jefe de Taller';
  const esSupervisor = userProfile.rol === 'Supervisor';
  const esCoordinador = userProfile.rol === 'Coordinador';
  // (El Coordinador puede actuar como ambos para ayudar)

  return (
    <div className="p-8 text-gray-900 space-y-12"> 
      
      <h1 className="text-3xl font-bold">Bandeja de Taller</h1>
      
      {/* --- 1. PENDIENTES DE DIAGNÓSTICO (CU-04 / Jefe de Taller) --- */}
      {/* Visible para Jefe de Taller y Coordinador */}
      {(esJefeDeTaller || esCoordinador) && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-red-600">Pendientes de Diagnóstico y Asignación</h2>
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={3} className="px-6 py-4 text-center">Cargando...</td></tr>
                ) : otsPendientesDiagnostico.length > 0 ? (
                  otsPendientesDiagnostico.map(ot => (
                    <tr key={ot.id}>
                      <td className="px-6 py-4 font-medium">{ot.patente}</td>
                      <td className="px-6 py-4">{ot.descripcionProblema}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleGestionarOT(ot.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
                        >
                          Diagnosticar / Asignar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="px-6 py-4 text-center">No hay OTs pendientes de diagnóstico.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* --- 2. ¡NUEVO! PENDIENTES DE APROBACIÓN (CU-06 / Supervisor) --- */}
      {/* Visible para Supervisor y Coordinador */}
      {(esSupervisor || esCoordinador) && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-yellow-600">Pendientes de Aprobación</h2>
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mecánico Asignado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-center">Cargando...</td></tr>
                ) : otsPendientesAprobacion.length > 0 ? (
                  otsPendientesAprobacion.map(ot => (
                    <tr key={ot.id}>
                      <td className="px-6 py-4 font-medium">{ot.patente}</td>
                      <td className="px-6 py-4">{ot.descripcionProblema}</td>
                      <td className="px-6 py-4 font-semibold">{ot.mecanicoAsignadoNombre || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleGestionarOT(ot.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700"
                        >
                          Revisar Aprobación
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="px-6 py-4 text-center">No hay OTs pendientes de aprobación.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* --- 3. SOLICITUDES DIGITALES (De Conductores) --- */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Entradas: Solicitudes Digitales</h2>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* ... (Esta tabla no cambia, la dejamos igual que en el paso anterior) ... */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center">Cargando...</td></tr>
              ) : solicitudes.length > 0 ? (
                solicitudes.map(req => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 font-medium">{req.patente_vehiculo}</td>
                    <td className="px-6 py-4">{req.nombre_conductor}</td>
                    <td className="px-6 py-4">{req.descripcion_falla}</td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button onClick={() => handleCrearOT('solicitud', req)} className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700">Crear OT</button>
                      <button onClick={() => handleRechazarSolicitud(req)} className="bg-red-600 text-white px-3 py-1 rounded shadow hover:bg-red-700">Rechazar</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-6 py-4 text-center">No hay solicitudes digitales pendientes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- 4. INGRESOS FÍSICOS (De Guardia) --- */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Entradas: Ingresos Físicos</h2>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* ... (Esta tabla tampoco cambia) ... */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chofer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo Ingreso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center">Cargando...</td></tr>
              ) : ingresos.length > 0 ? (
                ingresos.map(reg => (
                  <tr key={reg.id}>
                    <td className="px-6 py-4 font-medium">{reg.patente}</td>
                    <td className="px-6 py-4">{reg.chofer}</td>
                    <td className="px-6 py-4">{reg.motivoIngreso}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button onClick={() => handleCrearOT('ingreso', reg)} className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700">Crear OT</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-6 py-4 text-center">No hay ingresos físicos pendientes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}