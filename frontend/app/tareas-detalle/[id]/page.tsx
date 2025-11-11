// frontend/app/tareas-detalle/[id]/page.tsx
// (CÓDIGO CORREGIDO: Reemplaza 'router.refresh' por 'fetchDetalleOT')

'use client'; 
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; 
import { put } from '@vercel/blob'; 

type DetalleOrdenDeTrabajo = {
  id: string;
  patente: string;
  descripcionProblema: string; 
  estado: 'Pendiente' | 'En Progreso' | 'Finalizado';
  fechaCreacion: any; 
  repuestosUsados?: string;
  fotos?: string[]; 
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
  
  const { user, userProfile, loading: authLoading } = useAuth(); 

  // --- LÓGICA DE CARGA Y PROTECCIÓN ---
  
  // 1. Define la función de carga (AFUERA, para poder re-usarla)
  const fetchDetalleOT = async () => {
    if (!id || id === 'undefined') {
      setLoading(false);
      return;
    }
    setLoading(true); 
    try {
      const response = await fetch(`/api/ordenes-trabajo/${id}`);
      if (!response.ok) throw new Error('No se pudo cargar la OT');
      const data = await response.json();
      setOt(data); 
      setNuevoEstado(data.estado);
      if (data.repuestosUsados) setRepuestosUsados(data.repuestosUsados);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 2. useEffect (Protección y Carga Inicial)
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Mecánico', 'Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchDetalleOT(); // Llama a la función
        } else {
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router, id]);

  // (handleActualizar - Sin cambios)
  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
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
      toast.success('¡OT actualizada exitosamente!'); 
      router.push('/mis-tareas');
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // (handleFileChange - Sin cambios)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // --- ¡handleFileUpload CORREGIDO! ---
  const handleFileUpload = async () => {
    if (!selectedFile || !id) return;
    setIsUploading(true);
    try {
      const filename = `ot-${id}/${Date.now()}-${selectedFile.name}`;
      const response = await fetch(
        `/api/upload-foto?filename=${filename}`, 
        { method: 'POST', body: selectedFile }
      );
      if (!response.ok) throw new Error('Falló la subida del archivo a Vercel Blob');
      
      const newBlob = await response.json();
      const downloadURL = newBlob.url; 
      
      const updateResponse = await fetch(`/api/ordenes-trabajo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevaFotoURL: downloadURL }),
      });
      if (!updateResponse.ok) throw new Error('No se pudo guardar la URL de la foto en la OT');
      
      toast.success('¡Foto subida y guardada en la OT!');
      setSelectedFile(null); 
      
      // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
      // router.refresh(); // <-- Antes (Incorrecto)
      await fetchDetalleOT(); // <-- Ahora (Correcto: Vuelve a cargar los datos)
      // --- FIN DE LA CORRECCIÓN ---

    } catch (err) {
      console.error(err);
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // --- LÓGICA DE RETORNO TEMPRANO ---
  if (authLoading || !userProfile || loading) {
    return <div className="p-8 text-gray-900">Validando sesión y cargando OT...</div>;
  }
  
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!ot) return <div className="p-8 text-gray-900">OT no encontrada.</div>;

  // --- RENDERIZADO DE LA PÁGINA (Sin cambios en el JSX) ---
  return (
    <div className="p-8 text-gray-900 grid grid-cols-3 gap-8">
      
      {/* Columna Izquierda */}
      <div className="col-span-2 space-y-6">
        <h1 className="text-3xl font-bold">Detalle de OT-{ot.id.substring(0, 6)}</h1>
        {/* Info General */}
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
          <div>
            <label htmlFor="repuestos" className="block text-sm font-medium text-gray-700">Repuestos Utilizados</label>
            <textarea
              id="repuestos" rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
              placeholder="Ej: 1x Filtro de aceite (Código 1234)..."
              value={repuestosUsados}
              onChange={(e) => setRepuestosUsados(e.target.value)}
            />
          </div>
          
          {/* Evidencia Fotográfica */}
          <h2 className="text-xl font-semibold mt-6 mb-4">Evidencia Fotográfica</h2>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/png, image/jpeg"
              className="block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100"
            />
            <button
              type="button"
              onClick={handleFileUpload}
              disabled={isUploading || !selectedFile}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {isUploading ? 'Subiendo...' : 'Subir Foto'}
            </button>
          </div>
          
          {/* Mostrar Fotos Subidas */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Fotos Subidas:</h3>
            {ot && ot.fotos && ot.fotos.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {ot.fotos.map((fotoUrl, index) => (
                  <div key={index} className="relative w-full h-40 rounded-lg overflow-hidden shadow-md">
                    <Image
                      src={fotoUrl}
                      alt={`Evidencia ${index + 1}`}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Aún no se han subido fotos para esta OT.</p>
            )}
          </div>
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