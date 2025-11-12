// frontend/app/tareas-detalle/[id]/page.tsx
// (CÓDIGO REVERTIDO Y MEJORADO: Lógica de "Pool" y Auto-Asignación)

'use client'; 
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; 

// --- Tipo de Dato (Revertido a estados simples) ---
type DetalleOrdenDeTrabajo = {
  id: string;
  patente: string;
  descripcionProblema: string; 
  estado: 'Pendiente' | 'En Progreso' | 'Finalizado'; // ¡Solo 3 estados!
  fechaCreacion: any; 
  repuestosUsados?: string;
  fotos?: string[]; 
  mecanicoAsignadoId?: string | null;
  mecanicoAsignadoNombre?: string | null;
};
// (Ya no necesitamos el tipo Mecanico)

export default function DetalleOTPage() {
  
  const params = useParams();
  const id = params.id as string; 
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth(); 

  // --- Estados de la OT ---
  const [ot, setOt] = useState<DetalleOrdenDeTrabajo | null>(null);
  const [loading, setLoading] = useState(true); 
  
  // --- Estados para MODO MECÁNICO ---
  const [nuevoEstado, setNuevoEstado] = useState<'Pendiente' | 'En Progreso' | 'Finalizado'>('Pendiente');
  const [repuestosUsados, setRepuestosUsados] = useState(''); 
  const [isUpdating, setIsUpdating] = useState(false); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false); 

  // (Estados de Admin/Supervisor eliminados)

  // --- 1. Función de Carga (re-usable) ---
  const fetchDetalleOT = async () => {
    if (!id || id === 'undefined') { setLoading(false); return; }
    setLoading(true); 
    try {
      const response = await fetch(`/api/ordenes-trabajo/${id}`);
      if (!response.ok) throw new Error('No se pudo cargar la OT');
      const data: DetalleOrdenDeTrabajo = await response.json();
      setOt(data); 
      setNuevoEstado(data.estado);
      if (data.repuestosUsados) setRepuestosUsados(data.repuestosUsados);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // (fetchMecanicos eliminada)

  // --- 3. useEffect (Protección) ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        // Admins y Mecánicos pueden ver esta página
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador', 'Mecánico'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchDetalleOT(); // Carga la OT
        } else {
          router.push('/'); // Rol no permitido
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router, id]);

  // --- 4. Funciones de MODO MECÁNICO (¡CON AUTO-ASIGNACIÓN!) ---
  const handleActualizarMecanico = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    // Prepara el body base
    const body: {
      estado: string,
      repuestosUsados: string,
      mecanicoAsignadoId?: string,
      mecanicoAsignadoNombre?: string
    } = {
      estado: nuevoEstado,
      repuestosUsados: repuestosUsados,
    };

    // --- ¡LÓGICA DE AUTO-ASIGNACIÓN (POOL)! ---
    // Si la OT estaba "Pendiente" y el nuevo estado es "En Progreso",
    // el mecánico está "reclamando" la tarea.
    if (ot?.estado === 'Pendiente' && nuevoEstado === 'En Progreso') {
      if (userProfile) {
        body.mecanicoAsignadoId = userProfile.id;
        body.mecanicoAsignadoNombre = userProfile.nombre;
        toast.success('¡Tarea tomada! Asignada a ti.');
      } else {
        toast.error('No se pudo verificar tu perfil de mecánico.');
        setIsUpdating(false);
        return;
      }
    }
    // --- FIN DE LA LÓGICA ---

    try {
      const response = await fetch(`/api/ordenes-trabajo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('No se pudo actualizar el estado');
      
      // Si se auto-asignó, no lo redirige, solo recarga los datos
      if (body.mecanicoAsignadoId) {
        await fetchDetalleOT(); 
      } else {
        toast.success('¡OT actualizada!'); 
        router.push('/mis-tareas'); // Solo redirige si no fue la toma inicial
      }
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // (handleFileUpload y handleFileChange sin cambios)
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const filename = `ot-${id}/${Date.now()}-${selectedFile.name}`;
      const response = await fetch(`/api/upload-foto?filename=${filename}`, { method: 'POST', body: selectedFile });
      if (!response.ok) throw new Error('Falló la subida del archivo');
      const newBlob = await response.json();
      
      await fetch(`/api/ordenes-trabajo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevaFotoURL: newBlob.url }),
      });
      toast.success('¡Foto subida!');
      setSelectedFile(null); 
      await fetchDetalleOT(); // Recarga los datos
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };
  
  // (Funciones de Admin/Supervisor eliminadas)

  // --- 6. Lógica de Renderizado Temprano ---
  if (authLoading || !userProfile || loading) {
    return <div className="p-8 text-gray-900">Validando sesión y cargando OT...</div>;
  }
  if (!ot) return <div className="p-8 text-gray-900">OT no encontrada.</div>;

  // --- 7. Determinar qué vista mostrar ---
  // (Lógica de vistas simplificada)
  const esMecanico = userProfile.rol === 'Mecánico';
  const isAdmin = ['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol);

  // El formulario de acción es visible si eres Mecánico O si eres Admin
  // y la OT aún no ha sido tomada (Pendiente).
  const puedeGestionar = esMecanico || (isAdmin && ot.estado === 'Pendiente');
  // La subida de fotos solo la hace el mecánico asignado
  const puedeSubirFotos = esMecanico && ot.mecanicoAsignadoId === userProfile.id;
  // Los campos de repuestos solo los edita el mecánico asignado
  const puedeEditarRepuestos = esMecanico && ot.mecanicoAsignadoId === userProfile.id;

  return (
    <div className="p-8 text-gray-900 grid grid-cols-3 gap-8">
      
      {/* Columna Izquierda (Contenido) */}
      <div className="col-span-2 space-y-6">
        <h1 className="text-3xl font-bold">Detalle de OT-{ot.id.substring(0, 6)}</h1>
        
        {/* Info General */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Información General</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Patente</span>
              <p className="font-medium text-lg">{ot.patente}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Estado Actual</span>
              <p className={`font-bold text-lg ${
                ot.estado === 'Finalizado' ? 'text-green-600' :
                ot.estado === 'En Progreso' ? 'text-yellow-600' :
                'text-red-600' // Pendiente
              }`}>
                {ot.estado}
              </p>
            </div>
            {ot.mecanicoAsignadoNombre ? (
              <div>
                <span className="text-sm text-gray-500">Mecánico Asignado</span>
                <p className="font-medium text-lg">{ot.mecanicoAsignadoNombre}</p>
              </div>
            ) : (
              <div>
                <span className="text-sm text-gray-500">Mecánico Asignado</span>
                <p className="font-medium text-lg text-red-600">SIN ASIGNAR (En Pool)</p>
              </div>
            )}
            <div className="col-span-2">
              <span className="text-sm text-gray-500">Descripción del Problema</span>
              <p>{ot.descripcionProblema}</p>
            </div>
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
              disabled={!puedeEditarRepuestos && ot.estado !== 'Pendiente'} // Solo edita el mecánico asignado
            />
          </div>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Evidencia Fotográfica</h2>
          {/* Solo el mecánico asignado puede subir fotos */}
          {puedeSubirFotos && (
            <div className="flex items-center space-x-4">
              <input type="file" onChange={handleFileChange} accept="image/png, image/jpeg"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                type="button" onClick={handleFileUpload} disabled={isUploading || !selectedFile}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {isUploading ? 'Subiendo...' : 'Subir Foto'}
              </button>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Fotos Subidas:</h3>
            {ot.fotos && ot.fotos.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {ot.fotos.map((fotoUrl, index) => (
                  <div key={index} className="relative w-full h-40 rounded-lg overflow-hidden shadow-md">
                    <Image src={fotoUrl} alt={`Evidencia ${index + 1}`} layout="fill" objectFit="cover" priority={index < 3} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Aún no se han subido fotos.</p>
            )}
          </div>
        </div>
      </div>

      {/* Columna Derecha (Acciones) */}
      <div className="col-span-1">
        
        {/* VISTA DE GESTIÓN (MECÁNICO) */}
        {/* Un admin no puede gestionar la OT, solo el mecánico */}
        {esMecanico && (
          <form onSubmit={handleActualizarMecanico} className="bg-white p-6 rounded-lg shadow sticky top-8">
            <h2 className="text-xl font-semibold mb-4 text-green-600">Mi Trabajo</h2>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Actualizar Estado</label>
            <select
              id="estado" value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value as any)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900"
              disabled={ot.estado === 'Finalizado'} // No se puede cambiar si ya está finalizado
            >
              <option value="Pendiente">Pendiente (En Pool)</option>
              <option value="En Progreso">Iniciar Trabajo (Tomar)</option>
              <option value="Finalizado">Finalizar Trabajo</option>
            </select>
            <button
              type="submit" disabled={isUpdating || ot.estado === 'Finalizado'}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        )}

        {/* VISTA DE SOLO LECTURA (ADMIN) */}
        {isAdmin && (
           <div className="bg-white p-6 rounded-lg shadow sticky top-8">
             <h2 className="text-xl font-semibold mb-4 text-gray-700">Gestión de Tarea</h2>
             <p className="text-sm text-gray-600">
               Esta tarea está siendo gestionada por el "Pool" de mecánicos.
             </p>
             {ot.mecanicoAsignadoNombre && (
               <p className="text-sm text-gray-600 mt-2">
                 Tomada por: <strong className="text-gray-900">{ot.mecanicoAsignadoNombre}</strong>
               </p>
             )}
           </div>
        )}
        
      </div>
    </div>
  );
}