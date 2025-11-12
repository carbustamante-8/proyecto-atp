// frontend/app/generador-reportes/page.tsx
// (CÓDIGO CORREGIDO: Eliminada la columna "Acción")

'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 
import * as XLSX from 'xlsx'; 

type OrdenDeTrabajo = {
  id: string;
  patente: string;
  descripcionProblema: string;
  estado: string; 
  mecanicoAsignadoNombre?: string | null;
  fechaCreacion: { _seconds: number };
  fechaIngresoTaller?: { _seconds: number }; 
  fechaSalidaTaller?: { _seconds: number }; 
  repuestosUsados?: string; 
};

export default function GeneradorReportesPage() {
  
  const [ordenes, setOrdenes] = useState<OrdenDeTrabajo[]>([]); 
  const [ordenesFiltradas, setOrdenesFiltradas] = useState<OrdenDeTrabajo[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroPatente, setFiltroPatente] = useState(''); 
  const [filtroFechaInicio, setFiltroFechaInicio] = useState(''); 
  const [filtroFechaFin, setFiltroFechaFin] = useState(''); 

  // (Ya no necesitamos 'anulandoId')
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- Carga de Datos (sin cambios) ---
  useEffect(() => {
    if (!authLoading && user && userProfile) {
      const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador', 'Gerente'];
      if (rolesPermitidos.includes(userProfile.rol)) {
        fetchTodasLasOrdenes();
      } else {
        router.push('/'); 
      }
    } else if (!user && !authLoading) {
      router.push('/');
    }
  }, [user, userProfile, authLoading, router]);

  const fetchTodasLasOrdenes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo'); 
      if (!response.ok) throw new Error('No se pudieron cargar las órdenes');
      const data: OrdenDeTrabajo[] = await response.json();
      data.sort((a, b) => (b.fechaCreacion?._seconds || 0) - (a.fechaCreacion?._seconds || 0));
      setOrdenes(data);
      setOrdenesFiltradas(data); 
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // --- Lógica de Filtros (sin cambios) ---
  const handleGenerarReporte = (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    let filtradas = ordenes;
    if (filtroEstado !== 'Todos') {
      filtradas = filtradas.filter(ot => ot.estado === filtroEstado);
    }
    if (filtroPatente) {
      filtradas = filtradas.filter(ot => 
        ot.patente.toLowerCase().includes(filtroPatente.toLowerCase())
      );
    }
    if (filtroFechaInicio) {
      const inicioTs = new Date(filtroFechaInicio).getTime();
      filtradas = filtradas.filter(ot => 
        (ot.fechaCreacion._seconds * 1000) >= inicioTs
      );
    }
    if (filtroFechaFin) {
      const finTs = new Date(filtroFechaFin).getTime() + (24 * 60 * 60 * 1000 - 1); 
      filtradas = filtradas.filter(ot => 
        (ot.fechaCreacion._seconds * 1000) <= finTs
      );
    }
    setOrdenesFiltradas(filtradas);
    toast.success(`Reporte generado. ${filtradas.length} resultados.`);
    setLoading(false);
  };

  // (Función 'handleAnularOT' eliminada)
  
  // --- Lógica de Exportar a Excel (sin cambios) ---
  const handleExportExcel = () => {
    if (ordenesFiltradas.length === 0) {
      toast.error("No hay datos para exportar. Genera un reporte primero.");
      return;
    }
    const formatFecha = (fecha: { _seconds: number } | undefined | null) => {
      if (!fecha) return 'N/A';
      return new Date(fecha._seconds * 1000).toLocaleString('es-CL');
    };
    const datosParaExcel = ordenesFiltradas.map(ot => ({
      "ID OT": ot.id.substring(0, 6),
      "Patente": ot.patente,
      "Estado": ot.estado,
      "Mecánico Asignado": ot.mecanicoAsignadoNombre || 'N/A',
      "Descripción": ot.descripcionProblema,
      "Repuestos": ot.repuestosUsados || 'N/A',
      "Fecha Creación": formatFecha(ot.fechaCreacion),
      "Fecha Ingreso Taller": formatFecha(ot.fechaIngresoTaller),
      "Fecha Salida Taller": formatFecha(ot.fechaSalidaTaller),
    }));
    const ws = XLSX.utils.json_to_sheet(datosParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte OTs PepsiFleet");
    XLSX.writeFile(wb, "ReportePepsiFleet.xlsx");
  };

  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }
  
  return (
    <div className="p-8 text-gray-900">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Panel Maestro de OTs / Reportes</h1>
        <button 
          onClick={handleExportExcel} 
          disabled={loading || ordenesFiltradas.length === 0}
          className="bg-green-700 text-white px-5 py-2 rounded shadow hover:bg-green-800 disabled:bg-gray-400"
        >
          Exportar a Excel
        </button>
      </div>
      
      <form onSubmit={handleGenerarReporte} className="bg-white p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        {/* ... (Filtros de fecha y patente sin cambios) ... */}
        <div>
          <label htmlFor="filtroFechaInicio" className="block text-sm font-medium text-gray-700">Fecha Inicio (Creación)</label>
          <input type="date" id="filtroFechaInicio" value={filtroFechaInicio} onChange={(e) => setFiltroFechaInicio(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
        </div>
        <div>
          <label htmlFor="filtroFechaFin" className="block text-sm font-medium text-gray-700">Fecha Fin (Creación)</label>
          <input type="date" id="filtroFechaFin" value={filtroFechaFin} onChange={(e) => setFiltroFechaFin(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
        </div>
        <div>
          <label htmlFor="filtroPatente" className="block text-sm font-medium text-gray-700">Patente</label>
          <input type="text" id="filtroPatente" value={filtroPatente} onChange={(e) => setFiltroPatente(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-gray-50" placeholder="Ej: AB123CD" />
        </div>
        <div>
          <label htmlFor="filtroEstado" className="block text-sm font-medium text-gray-700">Estado</label>
          <select id="filtroEstado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-gray-50">
            <option value="Todos">Todos</option>
            <option value="Agendado">Agendado</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Progreso">En Progreso</option>
            <option value="Finalizado">Finalizado</option>
            <option value="Cerrado">Cerrado</option>
            <option value="Anulado">Anulado</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg shadow font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Filtrando...' : 'Generar Reporte'}
        </button>
      </form>

      {/* --- Tabla Maestra de OTs (COLUMNA ELIMINADA) --- */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mecánico</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              {/* --- COLUMNA "ACCIÓN" ELIMINADA --- */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center">Cargando OTs...</td></tr>
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
                  {/* --- CELDA "ACCIÓN" ELIMINADA --- */}
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-6 py-4 text-center">
                No se encontraron OTs con esos filtros.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}