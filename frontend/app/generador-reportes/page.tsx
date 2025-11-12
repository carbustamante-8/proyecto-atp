// frontend/app/generador-reportes/page.tsx
// (CÓDIGO ACTUALIZADO: Ahora es el "Panel Maestro" con botón de Anular)

'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 

// --- Tipo de Dato ---
type OrdenDeTrabajo = {
  id: string;
  patente: string;
  descripcionProblema: string;
  estado: string; // Agendado, Pendiente, En Progreso, Finalizado, Cerrado, Anulado
  mecanicoAsignadoNombre?: string | null;
  fechaCreacion: { _seconds: number };
  // (Podríamos añadir más campos)
};

export default function GeneradorReportesPage() {
  
  // --- Estados ---
  const [ordenes, setOrdenes] = useState<OrdenDeTrabajo[]>([]); // Todas las OTs
  const [ordenesFiltradas, setOrdenesFiltradas] = useState<OrdenDeTrabajo[]>([]); // OTs a mostrar
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('Todos'); // Filtro por estado
  const [anulandoId, setAnulandoId] = useState<string | null>(null);
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- Lógica de Protección y Carga ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        // Roles que pueden ver reportes
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador', 'Gerente'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchTodasLasOrdenes();
        } else {
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // --- Carga de Datos ---
  const fetchTodasLasOrdenes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo'); // Trae todas las OTs
      if (!response.ok) throw new Error('No se pudieron cargar las órdenes');
      
      const data: OrdenDeTrabajo[] = await response.json();
      
      // Ordena por fecha de creación descendente
      data.sort((a, b) => b.fechaCreacion._seconds - a.fechaCreacion._seconds);
      
      setOrdenes(data);
      setOrdenesFiltradas(data); // Inicialmente muestra todas

    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // --- Lógica de Filtros (¡NUEVO!) ---
  useEffect(() => {
    let filtradas = ordenes;
    if (filtroEstado !== 'Todos') {
      filtradas = filtradas.filter(ot => ot.estado === filtroEstado);
    }
    // (Aquí podríamos añadir más filtros de fecha, patente, etc.)
    setOrdenesFiltradas(filtradas);
  }, [filtroEstado, ordenes]);

  // --- ¡NUEVA ACCIÓN! Anular OT ---
  const handleAnularOT = async (otId: string) => {
    if (!confirm('¿Estás seguro de que quieres ANULAR esta OT? Esta acción no se puede deshacer.')) {
      return;
    }
    setAnulandoId(otId);
    try {
      const response = await fetch(`/api/ordenes-trabajo/${otId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'Anulado', // El nuevo estado final
          accion: 'anularOT' // El flag de seguridad de la API
        }),
      });

      if (!response.ok) throw new Error('Error al anular la OT');
      
      toast.success('¡OT Anulada!');
      
      // Refresca la lista actualizando solo el item cambiado
      setOrdenes(prev => prev.map(ot => 
        ot.id === otId ? { ...ot, estado: 'Anulado' } : ot
      ));

    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setAnulandoId(null);
    }
  };
  
  // (Función de Exportar a Excel - se mantiene, pero la quitamos por ahora para simplificar)
  // const handleExportar = () => { ... }

  // --- Lógica de Renderizado ---
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }
  
  // Solo Admins (no Gerente) pueden anular OTs
  const puedeAnular = ['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol);

  return (
    <div className="p-8 text-gray-900">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Panel Maestro de OTs / Reportes</h1>
        <button 
          // onClick={handleExportar} 
          disabled={true} // (Deshabilitado por ahora)
          className="bg-green-700 text-white px-5 py-2 rounded shadow hover:bg-green-800 disabled:bg-gray-400"
        >
          Exportar a Excel
        </button>
      </div>
      
      {/* --- Controles de Filtros --- */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <label htmlFor="filtroEstado" className="block text-sm font-medium text-gray-700">Filtrar por Estado:</label>
        <select
          id="filtroEstado"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
        >
          <option value="Todos">Todos los Estados</option>
          <option value="Agendado">Agendado</option>
          <option value="Pendiente">Pendiente (En Pool)</option>
          <option value="En Progreso">En Progreso</option>
          <option value="Finalizado">Finalizado</option>
          <option value="Cerrado">Cerrado</option>
          <option value="Anulado">Anulado</option>
        </select>
      </div>

      {/* --- Tabla Maestra de OTs --- */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mecánico</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando OTs...</td></tr>
            ) : ordenesFiltradas.length > 0 ? (
              ordenesFiltradas.map(ot => (
                <tr key={ot.id} className={`${ot.estado === 'Anulado' ? 'bg-red-50 opacity-60' : ''}`}>
                  <td className="px-6 py-4 font-medium">{ot.patente}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      ot.estado === 'Agendado' ? 'bg-gray-200 text-gray-800' :
                      ot.estado === 'Pendiente' ? 'bg-red-200 text-red-800' :
                      ot.estado === 'En Progreso' ? 'bg-yellow-200 text-yellow-800' :
                      ot.estado === 'Finalizado' ? 'bg-blue-200 text-blue-800' :
                      ot.estado === 'Cerrado' ? 'bg-green-200 text-green-800' :
                      ot.estado === 'Anulado' ? 'bg-red-300 text-red-900' :
                      ''
                    }`}>
                      {ot.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">{ot.mecanicoAsignadoNombre || 'N/A'}</td>
                  <td className="px-6 py-4">{ot.descripcionProblema}</td>
                  <td className="px-6 py-4">
                    {/* El botón de Anular solo aparece si la OT está Agendada y el usuario puede anular */}
                    {puedeAnular && ot.estado === 'Agendado' && (
                      <button
                        onClick={() => handleAnularOT(ot.id)}
                        disabled={anulandoId === ot.id}
                        className="bg-red-600 text-white px-3 py-1 rounded shadow hover:bg-red-700 disabled:bg-gray-400"
                      >
                        {anulandoId === ot.id ? '...' : 'Anular'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-6 py-4 text-center">
                No se encontraron OTs con esos filtros.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}