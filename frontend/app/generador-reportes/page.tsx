'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

// Importamos DatePicker y sus estilos base
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Importamos la librería de Excel
import * as XLSX from 'xlsx';

// --- ¡NUEVO! Iconos para la UI ---
import { 
  DocumentChartBarIcon, 
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline';

// (El tipo de dato no cambia)
type ReporteData = {
  id: string;
  patente: string;
  descripcionProblema: string;
  estado: string;
  fechaCreacion: string; // Formateada
  fechaCierre?: string; // Formateada
  mecanicoAsignadoNombre?: string;
  repuestosUsados?: string;
  costoTotal?: number;
};

export default function GeneradorReportesPage() {

  // (Toda la lógica de 'useState', 'useEffect' y 'fetch' queda idéntica)
  const [fechaInicio, setFechaInicio] = useState<Date | null>(new Date());
  const [fechaFin, setFechaFin] = useState<Date | null>(new Date());
  const [reporteData, setReporteData] = useState<ReporteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Supervisor', 'Jefe de Taller', 'Coordinador', 'Gerente'];
        if (!rolesPermitidos.includes(userProfile.rol)) {
          toast.error('Acceso denegado');
          router.push('/');
        } else {
          setLoading(false);
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const handleGenerarReporte = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Por favor, selecciona un rango de fechas.');
      return;
    }
    setLoadingReport(true);
    setReporteData([]); 
    
    const inicio = new Date(fechaInicio.setHours(0, 0, 0, 0));
    const fin = new Date(fechaFin.setHours(23, 59, 59, 999));

    try {
      const response = await fetch(`/api/reportes?inicio=${inicio.toISOString()}&fin=${fin.toISOString()}`);
      if (!response.ok) throw new Error('No se pudo generar el reporte');
      const data = await response.json();
      setReporteData(data);
      if (data.length === 0) {
        toast('No se encontraron datos para ese rango.', { icon: 'ℹ️' });
      }
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleExportarExcel = () => {
    if (reporteData.length === 0) {
      toast.error('No hay datos para exportar. Genera un reporte primero.');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(reporteData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ReporteTaller");
    XLSX.writeFile(wb, `Reporte_Taller_PepsiCo_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (authLoading || loading) {
    return <div className="p-8 font-sans">Validando sesión y cargando reportes...</div>;
  }

  // --- JSX REFACTORIZADO VISUALMENTE ---
  return (
    <div className="p-8 font-sans">
      
      <h1 className="text-3xl font-bold text-pepsi-blue mb-6">Generador de Reportes</h1>

      {/* --- Tarjeta de Filtros (Formulario) --- */}
      <div className="bg-white shadow-card rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          
          {/* Filtro Fecha Inicio */}
          <div className="w-full">
            <label htmlFor="fechaInicio" className="block text-sm font-medium text-neutral-700 mb-1">
              Fecha de Inicio
            </label>
            <DatePicker
              selected={fechaInicio}
              onChange={(date) => setFechaInicio(date)}
              selectsStart
              startDate={fechaInicio}
              endDate={fechaFin}
              dateFormat="dd/MM/yyyy"
              className="mt-1"
              wrapperClassName="w-full"
            />
          </div>
          
          {/* Filtro Fecha Fin */}
          <div className="w-full">
            <label htmlFor="fechaFin" className="block text-sm font-medium text-neutral-700 mb-1">
              Fecha de Fin
            </label>
            <DatePicker
              selected={fechaFin}
              onChange={(date) => setFechaFin(date)}
              selectsEnd
              startDate={fechaInicio}
              endDate={fechaFin}
              
              // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
              // Convertimos 'null' a 'undefined' para TypeScript
              minDate={fechaInicio || undefined} 
              
              dateFormat="dd/MM/yyyy"
              className="mt-1"
              wrapperClassName="w-full"
            />
          </div>
          
          {/* Botón Generar Reporte */}
          <button
            onClick={handleGenerarReporte}
            disabled={loadingReport}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-pepsi-blue text-white px-5 py-3 rounded-md shadow 
                       font-medium hover:bg-pepsi-blue-dark transition-colors duration-200 disabled:bg-gray-400"
          >
            <DocumentChartBarIcon className="h-5 w-5" />
            {loadingReport ? 'Generando...' : 'Generar Reporte'}
          </button>
          
          {/* Botón Exportar Excel (Verde) */}
          <button
            onClick={handleExportarExcel}
            disabled={reporteData.length === 0}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-3 rounded-md shadow 
                       font-medium hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Exportar a Excel
          </button>
        </div>
      </div>

      {/* --- Tarjeta de la Tabla de Resultados --- */}
      <div className="bg-white shadow-card rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Patente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Mecánico</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Fecha Creación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Fecha Cierre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Descripción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loadingReport ? (
              <tr><td colSpan={6} className="p-4 text-center text-neutral-700">Generando reporte...</td></tr>
            ) : reporteData.length > 0 ? (
              reporteData.map(ot => (
                <tr key={ot.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-neutral-900">{ot.patente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-700">{ot.mecanicoAsignadoNombre || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-700">{ot.fechaCreacion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-700">{ot.fechaCierre || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ot.estado === 'Completado' ? 'bg-indigo-100 text-indigo-800' :
                      ot.estado === 'Cerrado' ? 'bg-green-100 text-green-900' :
                      'bg-neutral-100 text-neutral-900'
                    }`}>
                      {ot.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-700">{ot.descripcionProblema}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-neutral-700">
                  Selecciona un rango de fechas y presiona "Generar Reporte".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}