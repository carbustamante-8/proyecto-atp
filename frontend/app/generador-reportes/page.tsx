'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 
import * as XLSX from 'xlsx'; 

// 1. Tipos de Datos Actualizados
type OrdenDeTrabajo = {
  id: string;
  patente: string;
  descripcionProblema: string;
  estado: string; 
  mecanicoAsignadoNombre?: string | null;
  mecanicoAsignadoId?: string | null; // <--- Importante para buscar el nombre
  fechaCreacion: { _seconds: number };
  fechaIngresoTaller?: { _seconds: number }; 
  fechaSalidaTaller?: { _seconds: number }; 
  fechaCierreAdministrativo?: { _seconds: number };
  repuestosUsados?: string; 
};

type Usuario = {
  id: string;
  nombre: string;
  rol: string;
};

const formatFecha = (fecha: { _seconds: number } | undefined | null) => {
  if (!fecha) return 'N/A';
  return new Date(fecha._seconds * 1000).toLocaleString('es-CL');
};

export default function GeneradorReportesPage() {
  
  const [ordenes, setOrdenes] = useState<OrdenDeTrabajo[]>([]); 
  const [ordenesFiltradas, setOrdenesFiltradas] = useState<OrdenDeTrabajo[]>([]); 
  const [usuarios, setUsuarios] = useState<Usuario[]>([]); // <--- Lista de mecánicos
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroPatente, setFiltroPatente] = useState(''); 
  const [filtroFechaInicio, setFiltroFechaInicio] = useState(''); 
  const [filtroFechaFin, setFiltroFechaFin] = useState(''); 

  const [anulandoId, setAnulandoId] = useState<string | null>(null);
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && userProfile) {
      const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador', 'Gerente'];
      if (rolesPermitidos.includes(userProfile.rol)) {
        cargarDatos();
      } else {
        router.push('/'); 
      }
    } else if (!user && !authLoading) {
      router.push('/');
    }
  }, [user, userProfile, authLoading, router]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // 1. Cargar OTs
      const resOTs = await fetch('/api/ordenes-trabajo'); 
      if (!resOTs.ok) throw new Error('Error al cargar OTs');
      const dataOTs: OrdenDeTrabajo[] = await resOTs.json();
      
      // 2. Cargar Usuarios (Para cruzar los nombres de los mecánicos)
      const resUsers = await fetch('/api/usuarios');
      if (resUsers.ok) {
        setUsuarios(await resUsers.json());
      }

      dataOTs.sort((a, b) => (b.fechaCreacion?._seconds || 0) - (a.fechaCreacion?._seconds || 0));
      setOrdenes(dataOTs);
      setOrdenesFiltradas(dataOTs); 
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIÓN INTELIGENTE PARA OBTENER EL NOMBRE ---
  const obtenerNombreMecanico = (ot: OrdenDeTrabajo) => {
    // 1. Si ya tiene el nombre guardado, úsalo.
    if (ot.mecanicoAsignadoNombre) return ot.mecanicoAsignadoNombre;
    
    // 2. Si no, busca el nombre usando el ID en la lista de usuarios.
    if (ot.mecanicoAsignadoId) {
      const mecanico = usuarios.find(u => u.id === ot.mecanicoAsignadoId);
      if (mecanico) return mecanico.nombre;
    }
    
    // 3. Si no hay nada, retorna N/A
    return 'N/A';
  };
  
  const handleGenerarReporte = (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    let filtradas = ordenes;
    
    // Aplicar filtros
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
    toast.success(`Reporte generado: ${filtradas.length} registros.`);
    setLoading(false);
  };

  const handleAnularOT = async (otId: string) => {
    setAnulandoId(otId);
    const promise = fetch(`/api/ordenes-trabajo/${otId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'Anulado', accion: 'anularOT' }),
    });

    toast.promise(promise, {
      loading: 'Anulando...',
      success: (res) => {
        if (!res.ok) throw new Error('Error');
        setOrdenes(prev => prev.map(ot => ot.id === otId ? { ...ot, estado: 'Anulado' } : ot));
        setAnulandoId(null);
        return 'OT Anulada';
      },
      error: () => { setAnulandoId(null); return 'Error al anular'; }
    });
  };
  
  const handleExportExcel = () => {
    if (ordenesFiltradas.length === 0) {
      toast.error("Sin datos para exportar.");
      return;
    }
    const datosParaExcel = ordenesFiltradas.map(ot => ({
      "ID OT": ot.id.substring(0, 6),
      "Patente": ot.patente,
      "Estado": ot.estado,
      "Mecánico Asignado": obtenerNombreMecanico(ot), // <--- USAMOS LA FUNCIÓN AQUÍ
      "Descripción": ot.descripcionProblema,
      "Repuestos": ot.repuestosUsados || 'N/A',
      "Fecha Creación": formatFecha(ot.fechaCreacion),
      "Fecha Ingreso Taller": formatFecha(ot.fechaIngresoTaller),
      "Fecha Cierre Admin": formatFecha(ot.fechaCierreAdministrativo),
      "Fecha Salida Taller": formatFecha(ot.fechaSalidaTaller),
    }));
    const ws = XLSX.utils.json_to_sheet(datosParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte OTs PepsiFleet");
    XLSX.writeFile(wb, "ReportePepsiFleet.xlsx");
  };

  if (authLoading || !userProfile) return <div className="p-8 text-gray-900">Cargando...</div>;
  
  const puedeAnular = ['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol);

  return (
    <div className="p-8 text-gray-900">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-pepsi-blue">Reportes Maestros</h1>
        <button 
          onClick={handleExportExcel} 
          disabled={loading || ordenesFiltradas.length === 0}
          className="bg-green-700 text-white px-5 py-2 rounded shadow hover:bg-green-800 disabled:bg-gray-400"
        >
          Exportar Excel
        </button>
      </div>
      
      <form onSubmit={handleGenerarReporte} className="bg-white p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700">Desde</label>
          <input type="date" value={filtroFechaInicio} onChange={(e) => setFiltroFechaInicio(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Hasta</label>
          <input type="date" value={filtroFechaFin} onChange={(e) => setFiltroFechaFin(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Patente</label>
          <input type="text" value={filtroPatente} onChange={(e) => setFiltroPatente(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" placeholder="AB123CD" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md">
            <option value="Todos">Todos</option>
            <option value="Agendado">Agendado</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Asignada">Asignada</option>
            <option value="En Progreso">En Progreso</option>
            <option value="Finalizado">Finalizado</option>
            <option value="Cerrado">Cerrado</option>
            <option value="Anulado">Anulado</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg shadow font-semibold hover:bg-blue-700 disabled:bg-gray-400">
          {loading ? '...' : 'Filtrar'}
        </button>
      </form>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mecánico</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingreso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cierre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">Cargando...</td></tr>
            ) : ordenesFiltradas.length > 0 ? (
              ordenesFiltradas.map(ot => (
                <tr key={ot.id} className={ot.estado === 'Anulado' ? 'bg-red-50 opacity-60' : ''}>
                  <td className="px-6 py-4 font-medium">{ot.patente}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      ot.estado === 'Agendado' ? 'bg-gray-200 text-gray-800' :
                      ot.estado === 'Pendiente' ? 'bg-red-200 text-red-800' :
                      ot.estado === 'Asignada' ? 'bg-blue-100 text-blue-800' :
                      ot.estado === 'En Progreso' ? 'bg-yellow-200 text-yellow-800' :
                      ot.estado === 'Finalizado' ? 'bg-blue-200 text-blue-800' :
                      ot.estado === 'Cerrado' ? 'bg-green-200 text-green-800' :
                      ot.estado === 'Anulado' ? 'bg-red-300 text-red-900' : ''
                    }`}>
                      {ot.estado}
                    </span>
                  </td>
                  
                  {/* --- AQUÍ SE MUESTRA EL NOMBRE --- */}
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    {obtenerNombreMecanico(ot)}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">{formatFecha(ot.fechaIngresoTaller)}</td>
                  <td className="px-6 py-4 text-sm text-blue-700 font-medium">{formatFecha(ot.fechaCierreAdministrativo)}</td>

                  <td className="px-6 py-4">
                    {puedeAnular && ot.estado === 'Agendado' && (
                      <button
                        onClick={() => handleAnularOT(ot.id)}
                        disabled={anulandoId === ot.id}
                        className="bg-red-600 text-white px-3 py-1 rounded shadow hover:bg-red-700 disabled:bg-gray-400 text-xs"
                      >
                        {anulandoId === ot.id ? '...' : 'Anular'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-6 py-4 text-center">No se encontraron resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}