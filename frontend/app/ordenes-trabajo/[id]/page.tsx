// app/ordenes-trabajo/[id]/page.tsx

'use client'; 

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; 

// 1. Define un "tipo" para los detalles de la OT
type DetalleOrdenDeTrabajo = {
  id: string;
  patente: string;
  descripcionProblema: string; 
  estado: 'Pendiente' | 'En Progreso' | 'Finalizado';
  fechaCreacion: any; 
};

// --- ¡LA LÍNEA CLAVE DEL ERROR ESTÁ AQUÍ! ---
// Asegúrate de que dice "export default function"
export default function DetalleOTPage() {
  
  // 2. Lee el ID de la OT desde la URL
  const params = useParams();
  const id = params.id as string; 
  const router = useRouter();

  // 3. Estados
  const [ot, setOt] = useState<DetalleOrdenDeTrabajo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState<'Pendiente' | 'En Progreso' | 'Finalizado'>('Pendiente');
  const [isUpdating, setIsUpdating] = useState(false);


  // 4. Hook para BUSCAR los datos de esta OT
  useEffect(() => {
    if (id) {
      const fetchDetalleOT = async () => {
        try {
          setLoading(true);
          
          const response = await fetch(`/api/ordenes-trabajo/${id}`);
          
          if (!response.ok) {
            throw new Error('No se pudo cargar la OT');
          }
          
          const data = await response.json();
          setOt(data); 
          setNuevoEstado(data.estado); 
          
        } catch (err) {
          if (err instanceof Error) setError(err.message);
          else setError('Un error desconocido ocurrió');
        } finally {
          setLoading(false);
        }
      };

      fetchDetalleOT();
    }
  }, [id]); 


  // 5. Función para ACTUALIZAR el estado
  const handleActualizarEstado = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');

    try {
      const response = await fetch(`/api/ordenes-trabajo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: nuevoEstado 
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo actualizar el estado');
      }

      alert('¡Estado actualizado!');
      router.push('/mis-tareas');

    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Un error desconocido ocurrió al actualizar');
    } finally {
      setIsUpdating(false);
    }
  };

  // --- JSX de Carga y Error ---
  if (loading) return <div className="p-8 text-gray-900">Cargando detalle de OT...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!ot) return <div className="p-8 text-gray-900">OT no encontrada.</div>;

  // 6. MUESTRA LOS DATOS (JSX basado en tu maqueta)
  return (
    <div className="p-8 text-gray-900 grid grid-cols-3 gap-8">
      
      {/* Columna Izquierda: Información y Registros */}
      <div className="col-span-2 space-y-6">
        <h1 className="text-3xl font-bold">Detalle de OT-{ot.id.substring(0, 6)}</h1>
        
        {/* Información General */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Información General</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-500">Patente</span>
              <p className="font-medium">{ot.patente}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Modelo</span>
              <p className="font-medium">Camión de Reparto XYZ</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Año</span>
              <p className="font-medium">2021</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">Descripción del Problema</span>
            <p>{ot.descripcionProblema}</p>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">Estado Actual</span>
            <p className="font-bold text-yellow-600">{ot.estado}</p>
          </div>
        </div>

        {/* Registro de Trabajo (Repuestos y Evidencia) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Registro de Trabajo</h2>
          <p className="text-gray-500">(Sección para añadir repuestos y evidencia fotográfica...)</p>
        </div>
      </div>

      {/* Columna Derecha: Acciones */}
      <div className="col-span-1">
        <form onSubmit={handleActualizarEstado} className="bg-white p-6 rounded-lg shadow sticky top-8">
          <h2 className="text-xl font-semibold mb-4">Acciones</h2>
          
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
            Actualizar Estado
          </label>
          <select
            id="estado"
            value={nuevoEstado}
            onChange={(e) => setNuevoEstado(e.target.value as any)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900"
          >
            <option value="Pendiente">Pendiente</option>
            <option value="En Progreso">En Progreso</option>
            <option value="Finalizado">Finalizado</option>
          </select>

          <button
            type="submit"
            disabled={isUpdating}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}