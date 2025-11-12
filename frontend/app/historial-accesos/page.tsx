// frontend/app/historial-accesos/page.tsx
// (CÓDIGO ACTUALIZADO: Añadidos filtros de fecha, por defecto "Últimos 7 días")

'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type HistorialOT = {
  id: string;
  patente: string;
  nombre_conductor?: string;
  fechaIngresoTaller?: { _seconds: number };
  fechaSalidaTaller?: { _seconds: number };
  estado: string;
};

export default function HistorialAccesosPage() {
  
  // --- Estados de Datos ---
  const [historialCompleto, setHistorialCompleto] = useState<HistorialOT[]>([]); // Guarda TODOS los datos
  const [historialFiltrado, setHistorialFiltrado] = useState<HistorialOT[]>([]); // Guarda solo lo que se muestra
  const [loading, setLoading] = useState(true);
  
  // --- Estados de Filtro ---
  const [filtroRango, setFiltroRango] = useState('7dias'); // Valor por defecto
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- 1. Carga de Datos (Solo 1 vez) ---
  useEffect(() => {
    if (!authLoading && user && userProfile) {
      if (['Guardia', 'Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol)) {
        fetchHistorial();
      } else {
        router.push('/');
      }
    } else if (!user && !authLoading) {
      router.push('/');
    }
  }, [user, userProfile, authLoading, router]);

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo');
      if (!response.ok) throw new Error('No se pudo cargar el historial');
      const data: HistorialOT[] = await response.json();
      
      const ingresados = data.filter(ot => ot.fechaIngresoTaller);
      ingresados.sort((a, b) => (b.fechaIngresoTaller?._seconds || 0) - (a.fechaIngresoTaller?._seconds || 0));
      
      setHistorialCompleto(ingresados); // Guarda la lista completa
      // (el useEffect de filtro se encargará de 'setHistorialFiltrado')
      
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Lógica de Filtro (Se ejecuta si 'historialCompleto' o 'filtroRango' cambian) ---
  useEffect(() => {
    
    const ahora = new Date();
    let fechaLimite = new Date();

    if (filtroRango === 'hoy') {
      fechaLimite.setHours(0, 0, 0, 0); // Inicio del día de hoy
    } else if (filtroRango === '7dias') {
      fechaLimite.setDate(ahora.getDate() - 7); // 7 días atrás
      fechaLimite.setHours(0, 0, 0, 0);
    } else if (filtroRango === '30dias') {
      fechaLimite.setDate(ahora.getDate() - 30); // 30 días atrás
      fechaLimite.setHours(0, 0, 0, 0);
    }

    if (filtroRango === 'todos') {
      setHistorialFiltrado(historialCompleto); // Muestra todo
    } else {
      const limiteTimestamp = fechaLimite.getTime(); // Límite en milisegundos
      
      const filtrado = historialCompleto.filter(ot => {
        if (!ot.fechaIngresoTaller) return false;
        const fechaIngreso = new Date(ot.fechaIngresoTaller._seconds * 1000).getTime();
        return fechaIngreso >= limiteTimestamp;
      });
      setHistorialFiltrado(filtrado);
    }
    
  }, [filtroRango, historialCompleto]); // Depende de la lista completa y del filtro

  
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }

  return (
    <div className="p-8 text-gray-900">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Historial de Accesos (Bitácora)</h1>
        
        {/* --- ¡NUEVO! Selector de Filtro --- */}
        <div>
          <label htmlFor="filtroRango" className="block text-sm font-medium text-gray-700">Mostrar:</label>
          <select
            id="filtroRango"
            value={filtroRango}
            onChange={(e) => setFiltroRango(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
          >
            <option value="7dias">Últimos 7 días</option>
            <option value="hoy">Hoy</option>
            <option value="30dias">Últimos 30 días</option>
            <option value="todos">Mostrar Todo el Historial</option>
          </select>
        </div>
        {/* --- Fin del Filtro --- */}
        
      </div>
      
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Entrada</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Salida</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado OT</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center">Cargando bitácora...</td></tr>
            ) : historialFiltrado.length > 0 ? ( // Renderiza la lista FILTRADA
              historialFiltrado.map(ot => (
                <tr key={ot.id}>
                  <td className="px-6 py-4 font-medium">{ot.patente}</td>
                  <td className="px-6 py-4">{ot.nombre_conductor || '-'}</td>
                  <td className="px-6 py-4 text-green-700">
                    {ot.fechaIngresoTaller ? new Date(ot.fechaIngresoTaller._seconds * 1000).toLocaleString('es-CL') : ''}
                  </td>
                  <td className="px-6 py-4 text-red-700">
                    {ot.fechaSalidaTaller ? new Date(ot.fechaSalidaTaller._seconds * 1000).toLocaleString('es-CL') : 'En Taller'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {ot.estado}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="p-4 text-center">No hay registros de ingreso en el rango seleccionado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}