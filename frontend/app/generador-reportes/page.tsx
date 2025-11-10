// frontend/app/generador-reportes/page.tsx

'use client'; 

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; 
import { useRouter } from 'next/navigation';   
import * as XLSX from 'xlsx'; 

// --- ¡ARREGLO 1! ---
// Actualizamos los "tipos" para que coincidan con lo que llega del JSON

type ReporteOT = {
  id: string;
  patente: string;
  fechaIngreso: any; 
  fechaSalida: any; 
  tiempoEstancia: string; 
  mecanicoAsignado: string; 
  estado: string;
};

// Este es el "tipo" de dato que realmente llega desde la API
type OT_Desde_API = {
  id: string;
  patente: string;
  estado: string;
  mecanicoAsignado?: string;
  fechaCreacion: { // ¡Viene como un objeto simple!
    _seconds: number;
    _nanoseconds: number;
  }
}
// --- FIN ARREGLO 1 ---

export default function ReportesPage() {
  
  // --- (Tus 'useState' y 'useAuth' no cambian) ---
  const [reporteData, setReporteData] = useState<ReporteOT[]>([]);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estado, setEstado] = useState('Todos');
  const [patente, setPatente] = useState('');
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- (Tu 'useEffect' de protección no cambia) ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador', 'Gerente'];
        if (!rolesPermitidos.includes(userProfile.rol)) {
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  
  // --- Función para "Generar Reporte" ---
  const handleGenerarReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (estado && estado !== 'Todos') params.append('estado', estado);
      if (patente) params.append('patente', patente);
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);

      const response = await fetch(`/api/reportes?${params.toString()}`);
      if (!response.ok) throw new Error('No se pudo generar el reporte');
      
      const data: OT_Desde_API[] = await response.json(); // Usa el nuevo tipo
      
      // --- ¡ARREGLO 2! ---
      // Mapea los datos leyendo '_seconds' en lugar de '.toMillis()'
      const dataFormateada = data.map((ot) => ({
        id: ot.id,
        patente: ot.patente || 'N/A',
        // ¡Aquí está la corrección!
        fechaIngreso: ot.fechaCreacion && ot.fechaCreacion._seconds 
                      ? new Date(ot.fechaCreacion._seconds * 1000).toLocaleDateString('es-CL') 
                      : 'N/A',
        fechaSalida: 'N/A', 
        tiempoEstancia: 'N/A',
        mecanicoAsignado: ot.mecanicoAsignado || 'N/A',
        estado: ot.estado || 'N/A',
      }));
      // --- FIN ARREGLO 2 ---
      
      setReporteData(dataFormateada);
      
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Un error desconocido ocurrió');
    } finally {
      setLoading(false); 
    }
  };

  // --- (Tu 'handleExportExcel' no cambia) ---
   const handleExportExcel = () => {
    if (reporteData.length === 0) {
      setError("No hay datos para exportar. Por favor, genera un reporte primero.");
      return;
    }
    const datosParaExcel = reporteData.map(ot => ({
      "ID OT": ot.id.substring(0, 6),
      "Patente": ot.patente,
      "Fecha Ingreso": ot.fechaIngreso,
      "Fecha Salida": ot.fechaSalida,
      "Tiempo Estancia (H)": ot.tiempoEstancia,
      "Mecánico Asignado": ot.mecanicoAsignado,
      "Estado Final": ot.estado,
    }));
    const ws = XLSX.utils.json_to_sheet(datosParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte OTs");
    XLSX.writeFile(wb, "ReportePepsiFleet.xlsx");
  };

  // --- (Tu 'if (authLoading...)' no cambia) ---
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  if (!['Jefe de Taller', 'Supervisor', 'Coordinador', 'Gerente'].includes(userProfile.rol)) {
     return <div className="p-8 text-gray-900">Acceso denegado.</div>;
  }
  
  // --- RENDERIZADO DE LA PÁGINA (Sin cambios) ---
  return (
    <div className="p-8 text-gray-900"> 
      
      <h1 className="text-3xl font-bold mb-6">Generador de Reportes</h1>
      <p className="text-gray-600 mb-6">Seleccione los filtros para extraer los datos de la operación.</p>

      {/* Formulario de Filtros */}
       <form onSubmit={handleGenerarReporte} className="bg-white p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
          <input
            type="date" id="fechaInicio" value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
          />
        </div>
        <div>
          <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
          <input
            type="date" id="fechaFin" value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
          />
        </div>
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado de OT</label>
          <select
            id="estado" value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
          >
            <option value="Todos">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Progreso">En Progreso</option>
            <option value="Finalizado">Finalizado</option>
          </select>
        </div>
        <div>
          <label htmlFor="patente" className="block text-sm font-medium text-gray-700">Patente</label>
          <input
            type="text" id="patente" value={patente}
            onChange={(e) => setPatente(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            placeholder="Ingresar patente"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg shadow font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Generando...' : 'Generar Reporte'}
        </button>
      </form>

      {/* Tabla de Resultados */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Vista Previa del Reporte</h2>
        <button
          onClick={handleExportExcel}
          disabled={reporteData.length === 0 || loading} 
          className="bg-green-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-green-700 disabled:bg-gray-400"
        >
          Exportar Datos a Excel
        </button>
      </div>
      
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID OT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Ingreso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Salida</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiempo Estancia (H)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mecánico Asignado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado Final</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr><td colSpan={7} className="px-6 py-4 text-center">Generando reporte...</td></tr>
            )}
            {error && (
              <tr><td colSpan={7} className="px-6 py-4 text-center text-red-500">{error}</td></tr>
            )}
            {!loading && !error && reporteData.length > 0 ? (
              reporteData.map(ot => (
                <tr key={ot.id}>
                  <td className="px-6 py-4">{ot.id.substring(0, 6)}</td>
                  <td className="px-6 py-4 font-medium">{ot.patente}</td>
                  <td className="px-6 py-4">{ot.fechaIngreso}</td>
                  <td className="px-6 py-4">{ot.fechaSalida}</td>
                  <td className="px-6 py-4">{ot.tiempoEstancia}</td>
                  <td className="px-6 py-4">{ot.mecanicoAsignado}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ot.estado === 'Finalizado' ? 'bg-green-100 text-green-800' :
                      ot.estado === 'En Progreso' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {ot.estado}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              !loading && !error && reporteData.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-4 text-center">No se encontraron datos para este reporte. Use el filtro y presione "Generar Reporte".</td></tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}