'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

// (Tipo de dato de la OT/Log)
type OT = {
  id: string;
  patente: string;
  nombre_conductor: string;
  estado: string;
  fechaIngresoTaller?: { _seconds: number }; // Usado por Guardia
  fechaSalidaTaller?: { _seconds: number };  // Usado por Guardia
};

// --- ¡Estilo estándar para inputs (v3)! ---
const inputStyle = "w-full px-4 py-3 border border-gray-300 rounded-md text-neutral-900 bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-pepsi-blue-light focus:border-transparent transition-shadow duration-200";

export default function HistorialAccesosPage() {
  
  // (Toda la lógica de 'useState', 'useEffect' y 'fetch' queda idéntica)
  const [historial, setHistorial] = useState<OT[]>([]);
  const [filtroPatente, setFiltroPatente] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        // Roles que pueden ver esta página (según documentación)
        const rolesPermitidos = ['Supervisor', 'Jefe de Taller', 'Guardia'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchHistorial();
        } else {
          toast.error('Acceso denegado');
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo');
      if (!response.ok) throw new Error('No se pudo cargar el historial');
      const data: OT[] = await response.json();
      
      // Filtramos solo los estados relevantes para la bitácora de accesos
      const historialFiltrado = data.filter(ot => 
        ['Pendiente', 'Asignada', 'En Progreso', 'Finalizado', 'Cerrado', 'Completado', 'Anulado'].includes(ot.estado)
      );
      
      // Ordenar por fecha de ingreso (más reciente primero)
      historialFiltrado.sort((a, b) => (b.fechaIngresoTaller?._seconds || 0) - (a.fechaIngresoTaller?._seconds || 0));
      
      setHistorial(historialFiltrado);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const historialFiltrado = historial.filter(ot =>
    ot.patente.toLowerCase().includes(filtroPatente.toLowerCase())
  );

  if (authLoading || loading) {
    return <div className="p-8 font-sans">Validando sesión y cargando bitácora...</div>;
  }

  // --- JSX REFACTORIZADO VISUALMENTE ---
  return (
    <div className="p-8 font-sans">
      
      {/* Título con color Pepsi */}
      <h1 className="text-3xl font-bold text-pepsi-blue mb-6">Historial de Accesos (Bitácora)</h1>

      {/* --- Tarjeta de Filtro --- */}
      <div className="bg-white shadow-card rounded-lg p-4 mb-6 max-w-md">
        <label htmlFor="filtroPatente" className="block text-sm font-medium text-neutral-700 mb-1">
          Buscar por Patente
        </label>
        <input
          type="text"
          id="filtroPatente"
          value={filtroPatente}
          onChange={(e) => setFiltroPatente(e.target.value)}
          placeholder="Ej: ABCD12..."
          className={inputStyle} // Estilo estándar v3
        />
      </div>

      {/* --- Tarjeta de la Tabla --- */}
      <div className="bg-white shadow-card rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Header de la tabla (neutral) */}
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Patente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Conductor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Fecha Ingreso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Hora Ingreso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Fecha Salida</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Hora Salida</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Estado OT</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {historialFiltrado.length > 0 ? (
              historialFiltrado.map(ot => (
                <tr key={ot.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-neutral-900">{ot.patente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-700">{ot.nombre_conductor}</td>
                  
                  {/* Fecha y Hora de Ingreso */}
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-700">
                    {ot.fechaIngresoTaller ? new Date(ot.fechaIngresoTaller._seconds * 1000).toLocaleDateString('es-CL') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-700">
                    {ot.fechaIngresoTaller ? new Date(ot.fechaIngresoTaller._seconds * 1000).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  
                  {/* Fecha y Hora de Salida */}
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-700">
                    {ot.fechaSalidaTaller ? new Date(ot.fechaSalidaTaller._seconds * 1000).toLocaleDateString('es-CL') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-700">
                    {ot.fechaSalidaTaller ? new Date(ot.fechaSalidaTaller._seconds * 1000).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  
                  {/* Pastillas de Estado (Rediseñadas) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ot.estado === 'Completado' ? 'bg-indigo-100 text-indigo-800' :
                      ot.estado === 'Cerrado' ? 'bg-green-100 text-green-900' :
                      ot.estado === 'Finalizado' ? 'bg-green-100 text-green-800' :
                      ot.estado === 'En Progreso' ? 'bg-yellow-100 text-yellow-800' :
                      ot.estado === 'Asignada' ? 'bg-blue-100 text-pepsi-blue-light' :
                      ot.estado === 'Pendiente' ? 'bg-red-100 text-pepsi-red' :
                      ot.estado === 'Anulado' ? 'bg-red-100 text-pepsi-red' :
                      'bg-neutral-100 text-neutral-900' // 'Agendado' u otro
                    }`}>
                      {ot.estado}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-4 text-center text-neutral-700">
                  No se encontraron registros de acceso.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}