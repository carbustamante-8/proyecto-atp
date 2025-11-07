// app/tareas-detalle/[id]/page.tsx

'use client'; 

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; 

type DetalleOrdenDeTrabajo = {
  id: string;
  patente: string;
  descripcionProblema: string; 
  estado: 'Pendiente' | 'En Progreso' | 'Finalizado';
  fechaCreacion: any; 
  repuestosUsados?: string; 
};

export default function DetalleOTPage() {
  
  const params = useParams();
  const id = params.id as string; 
  const router = useRouter();

  const [ot, setOt] = useState<DetalleOrdenDeTrabajo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [nuevoEstado, setNuevoEstado] = useState<'Pendiente' | 'En Progreso' | 'Finalizado'>('Pendiente');
  const [repuestosUsados, setRepuestosUsados] = useState(''); 
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchDetalleOT = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/ordenes-trabajo/${id}`);
          if (!response.ok) throw new Error('No se pudo cargar la OT');
          const data = await response.json();
          setOt(data); 
          setNuevoEstado(data.estado);
          if (data.repuestosUsados) {
            setRepuestosUsados(data.repuestosUsados);
          }
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

  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');
    try {
      const response = await fetch(`/api/ordenes-trabajo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: nuevoEstado, 
          repuestosUsados: repuestosUsados, 
        }),
      });
      if (!response.ok) throw new Error('No se pudo actualizar el estado');
      alert('¡OT actualizada!');
      router.push('/mis-tareas');
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Un error desconocido ocurrió al actualizar');
    } finally {
      setIsUpdating(false);
    }
  };

  // --- ¡NUEVA LÓGICA DE SUBIDA DE FOTOS (Vercel Blob)! ---

  // Esta se activa cuando el usuario elige un archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]); // Guarda el archivo en el estado
    }
  };

  // Esta se activa cuando el usuario presiona "Subir Foto"
  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Primero selecciona un archivo.');
      return;
    }
    if (!id) {
      setError('No se ha cargado el ID de la OT.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // 1. ¡NUEVA API! Llama a tu backend de Vercel Blob
      // Le pasa el nombre del archivo en la URL
      const response = await fetch(
        `/api/upload-foto?filename=ot-${id}/${selectedFile.name}`,
        {
          method: 'POST',
          body: selectedFile, // ¡El body es el archivo mismo!
        }
      );

      if (!response.ok) {
        throw new Error('Falló la subida del archivo a Vercel Blob');
      }

      // 2. Obtiene la URL pública desde Vercel Blob
      const newBlob = await response.json();
      const downloadURL = newBlob.url; // La URL pública de la foto

      console.log('¡Archivo subido! URL:', downloadURL);

      // 3. Llama a tu API PUT (la que ya existe) para guardar la URL en la OT
      const updateResponse = await fetch(`/api/ordenes-trabajo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nuevaFotoURL: downloadURL // Envía la URL de Vercel Blob
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('No se pudo guardar la URL de la foto en la OT');
      }

      alert('¡Foto subida y guardada en la OT!');
      setSelectedFile(null); // Limpia el input
      // (En un futuro, recargamos la OT para mostrar la foto)

    } catch (err) {
      console.error(err);
      if (err instanceof Error) setError(err.message);
      else setError('Un error desconocido ocurrió al subir la foto');
    } finally {
      setIsUploading(false);
    }
  };
  // --- FIN DE LA NUEVA LÓGICA ---

  if (loading) return <div className="p-8 text-gray-900">Cargando detalle de OT...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!ot) return <div className="p-8 text-gray-900">OT no encontrada.</div>;

  return (
    <div className="p-8 text-gray-900 grid grid-cols-3 gap-8">
      
      {/* Columna Izquierda */}
      <div className="col-span-2 space-y-6">
        <h1 className="text-3xl font-bold">Detalle de OT-{ot.id.substring(0, 6)}</h1>
        
        {/* Información General */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Información General</h2>
          <div className="mt-4">
            <span className="text-sm text-gray-500">Patente</span>
            <p className="font-medium">{ot.patente}</p>
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

        {/* Registro de Trabajo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Registro de Trabajo</h2>
          
          {/* Campo de Texto para Repuestos */}
          <div>
            <label htmlFor="repuestos" className="block text-sm font-medium text-gray-700">
              Repuestos Utilizados
            </label>
            <textarea
              id="repuestos"
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
              placeholder="Ej: 1x Filtro de aceite (Código 1234)..."
              value={repuestosUsados}
              onChange={(e) => setRepuestosUsados(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Escribe los repuestos. Presiona "Guardar Cambios" (a la derecha).
            </p>
          </div>
          
          {/* Espacio para la futura Evidencia Fotográfica */}
          <h2 className="text-xl font-semibold mt-6 mb-4">Evidencia Fotográfica</h2>
          <p className="text-gray-500">(Sección para subir fotos...)</p>
        </div>
      </div>

      {/* Columna Derecha */}
      <div className="col-span-1">
        <form onSubmit={handleActualizar} className="bg-white p-6 rounded-lg shadow sticky top-8">
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