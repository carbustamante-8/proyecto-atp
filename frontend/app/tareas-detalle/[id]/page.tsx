// frontend/app/tareas-detalle/[id]/page.tsx
// (CÓDIGO ACTUALIZADO: Lógica condicional para Admin vs Mecánico)

'use client'; 
import { useState, useEffect, useRef, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; 

type DetalleOrdenDeTrabajo = {
  id: string;
  patente: string;
  descripcionProblema: string; 
  // ¡Añadido 'Asignada'!
  estado: 'Agendado' | 'Pendiente' | 'Asignada' | 'En Progreso' | 'Finalizado' | 'Cerrado' | 'Anulado';
  fechaCreacion: any; 
  repuestosUsados?: string;
  fotos?: string[]; 
  mecanicoAsignadoId?: string | null;
  mecanicoAsignadoNombre?: string | null;
};

// ¡NUEVO TIPO!
type Mecanico = {
  id: string;
  nombre: string;
};

export default function DetalleOTPage() {
  
  const params = useParams();
  const id = params.id as string; 
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth(); 

  const [ot, setOt] = useState<DetalleOrdenDeTrabajo | null>(null);
  const [loading, setLoading] = useState(true); 
  
  // --- Estados para MODO MECÁNICO ---
  const [nuevoEstado, setNuevoEstado] = useState<'Asignada' | 'En Progreso' | 'Finalizado'>('Asignada');
  const [repuestosUsados, setRepuestosUsados] = useState(''); 
  const [isUpdating, setIsUpdating] = useState(false); 
  
  // --- Estados de Fotos (sin cambios) ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); 
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  
  // --- ¡NUEVO! Estados para MODO ADMIN (Asignación) ---
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [mecanicoAsignadoId, setMecanicoAsignadoId] = useState('');
  const [mecanicoAsignadoNombre, setMecanicoAsignadoNombre] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // --- 1. Función de Carga ---
  const fetchDetalleOT = async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true); 
    try {
      const response = await fetch(`/api/ordenes-trabajo/${id}`);
      if (!response.ok) throw new Error('No se pudo cargar la OT');
      const data: DetalleOrdenDeTrabajo = await response.json();
      setOt(data); 
      
      // Setea el estado actual del mecánico (si aplica)
      if (data.estado === 'Asignada' || data.estado === 'En Progreso' || data.estado === 'Finalizado') {
        setNuevoEstado(data.estado);
      }
      if (data.repuestosUsados) setRepuestosUsados(data.repuestosUsados);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // --- 2. useEffect (Carga mecánicos para el Admin) ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador', 'Mecánico'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchDetalleOT();
          // Si eres Admin, carga la lista de mecánicos para el selector
          if (['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol)) {
            fetchMecanicos();
          }
        } else {
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router, id]);

  // --- ¡NUEVO! Carga de Mecánicos (para Admin) ---
  const fetchMecanicos = async () => {
    try {
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('No se pudo cargar la lista de mecánicos');
      const usuarios = await response.json();
      const listaMecanicos = usuarios
        .filter((u: any) => u.rol === 'Mecánico' && u.estado === 'Activo')
        .map((u: any) => ({ id: u.id, nombre: u.nombre }));
      setMecanicos(listaMecanicos);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  // --- 3. Funciones de MODO MECÁNICO (¡SIN auto-asignación!) ---
  const handleActualizarMecanico = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsUpdating(true);
    
    // El body ya no necesita la lógica de auto-asignación
    const body = {
      estado: nuevoEstado,
      repuestosUsados: repuestosUsados,
    };

    try {
      const response = await fetch(`/api/ordenes-trabajo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('No se pudo actualizar el estado');
      
      toast.success('¡OT actualizada!'); 
      if (nuevoEstado === 'Finalizado') {
        router.push('/mis-tareas'); // Redirige si finaliza
      } else {
        await fetchDetalleOT(); // Solo recarga
      }
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // (Funciones de fotos - sin cambios)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };
  const handleRemovePreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; 
    }
  };
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
      handleRemovePreview(); 
      await fetchDetalleOT(); 
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };
  
  // --- ¡NUEVO! Funciones de MODO ADMIN ---
  const handleMecanicoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedMecanico = mecanicos.find(m => m.id === selectedId);
    setMecanicoAsignadoId(selectedId);
    setMecanicoAsignadoNombre(selectedMecanico ? selectedMecanico.nombre : '');
  };

  const handleAsignarOT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mecanicoAsignadoId) {
      toast.error('Debes seleccionar un mecánico para asignar.');
      return;
    }
    setIsAssigning(true);
    const promise = fetch(`/api/ordenes-trabajo/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accion: 'asignarTarea', // Flag para la API
        mecanicoAsignadoId: mecanicoAsignadoId,
        mecanicoAsignadoNombre: mecanicoAsignadoNombre,
        // La API la pasará a estado "Asignada"
      }),
    });

    toast.promise(promise, {
      loading: 'Asignando OT...',
      success: (res) => {
        if (!res.ok) throw new Error('No se pudo asignar la OT');
        fetchDetalleOT(); // Recarga la OT (ahora en estado Asignada)
        setIsAssigning(false);
        return `¡OT Asignada a ${mecanicoAsignadoNombre}!`;
      },
      error: (err) => {
        setIsAssigning(false);
        return err.message || 'No se pudo asignar la OT';
      }
    });
  };

  
  // --- Lógica de Renderizado ---
  if (authLoading || !userProfile || loading) {
    return <div className="p-8 text-gray-900">Validando sesión y cargando OT...</div>;
  }
  if (!ot) return <div className="p-8 text-gray-900">OT no encontrada.</div>;

  const esMecanico = userProfile.rol === 'Mecánico';
  const isAdmin = ['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol);
  
  // El mecánico puede editar si la OT es SUYA y está 'Asignada' o 'En Progreso'
  const puedeEditar = esMecanico && 
                      ot.mecanicoAsignadoId === userProfile.id && 
                      (ot.estado === 'Asignada' || ot.estado === 'En Progreso');
                      
  // El Admin ve el formulario de Asignación si la OT está 'Pendiente'
  const showAdminAssignForm = isAdmin && ot.estado === 'Pendiente';
  
  // El Mecánico ve la página de trabajo si la OT es suya o si es Admin
  const showWorkView = esMecanico || isAdmin;

  return (
    <Fragment>
    
      {/* (Modal de Foto Ampliada - sin cambios) */}
      {fotoAmpliada && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
            <Image 
              src={fotoAmpliada} 
              alt="Evidencia ampliada"
              layout="fill"
              objectFit="contain"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
          <button
            onClick={() => setFotoAmpliada(null)}
            className="absolute top-4 right-4 bg-white text-black rounded-full w-10 h-10 text-2xl font-bold shadow-lg"
          >
            &times;
          </button>
        </div>
      )}

      <div className="p-8 text-gray-900 grid grid-cols-3 gap-8">
        
        {/* Columna Izquierda (Contenido) */}
        {showWorkView ? (
          <div className="col-span-2 space-y-6"> 
            
            <h1 className="text-3xl font-bold">Detalle de OT-{ot.id.substring(0, 6)}</h1>
            
            {/* Botón Volver (solo para Mecánico) */}
            {esMecanico && (
              <button
                onClick={() => router.back()} 
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                ← Volver a Mi Tablero
              </button>
            )}
            
            {/* Botón Volver (solo para Admin) */}
            {isAdmin && (
              <button
                onClick={() => router.back()} // Vuelve a la agenda, cierre, etc.
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                ← Volver al listado
              </button>
            )}
            
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
                      ot.estado === 'Cerrado' ? 'text-gray-500' :
                      ot.estado === 'En Progreso' ? 'text-yellow-600' :
                      ot.estado === 'Asignada' ? 'text-blue-600' : // ¡Nuevo!
                      ot.estado === 'Pendiente' ? 'text-red-600' :
                      'text-gray-400' 
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
              <h2 className="text-xl font-semibold mb-4">Registro de Trabajo (Mecánico)</h2>
              <div>
                <label htmlFor="repuestos" className="block text-sm font-medium text-gray-700">Repuestos Utilizados / Trabajo Realizado</label>
                <textarea
                  id="repuestos" rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
                  placeholder={puedeEditar ? "Ej: 1x Filtro de aceite (Código 1234)..." : "Solo el mecánico asignado puede editar."}
                  value={repuestosUsados}
                  onChange={(e) => setRepuestosUsados(e.target.value)}
                  disabled={!puedeEditar} 
                />
              </div>
              
              <h2 className="text-xl font-semibold mt-6 mb-4">Evidencia Fotográfica</h2>
              
              {/* Previsualización de Foto (solo si 'puedeEditar') */}
              {puedeEditar && (
                <div className="border border-gray-200 p-4 rounded-lg">
                  {previewUrl && (
                    <div className="mb-4 relative w-1/2">
                      <p className="text-sm font-medium text-gray-700 mb-2">Previsualización:</p>
                      <Image src={previewUrl} alt="Previsualización" width={200} height={200} className="rounded-md object-cover" />
                      <button type="button" onClick={handleRemovePreview}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold"
                      >&times;</button>
                    </div>
                  )}
                  {!previewUrl && (
                    <div className="mb-4">
                      <label htmlFor="foto" className="block text-sm font-medium text-gray-700">Seleccionar foto...</label>
                      <input type="file" id="foto" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  )}
                  <button type="button" onClick={handleFileUpload} disabled={isUploading || !selectedFile}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {isUploading ? 'Subiendo...' : 'Subir Foto'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">Nota: Debes "Subir Foto" antes de guardar cambios.</p>
                </div>
              )}

              {/* Galería de Fotos Subidas */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold">Fotos Subidas:</h3>
                {ot.fotos && ot.fotos.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {ot.fotos.map((fotoUrl, index) => (
                      <div 
                        key={index} 
                        className="relative w-full h-40 rounded-lg overflow-hidden shadow-md cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setFotoAmpliada(fotoUrl)}
                      >
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
        ) : (
          <div className="col-span-2">
            <p className="text-red-500">No tienes permiso para ver esta OT.</p>
          </div>
        )}

        {/* Columna Derecha (Acciones) */}
        <div className="col-span-1">
          
          {/* --- VISTA 1: Formulario de Asignación (ADMIN) --- */}
          {showAdminAssignForm && (
            <form onSubmit={handleAsignarOT} className="bg-white p-6 rounded-lg shadow sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-blue-600">Asignar Tarea</h2>
              <p className="text-sm text-gray-600 mb-4">Esta OT está en el Pool. Asigna un mecánico para que pueda empezar.</p>
              
              <label htmlFor="mecanico" className="block text-sm font-medium text-gray-700">Asignar a Mecánico</label>
              <select
                id="mecanico"
                value={mecanicoAsignadoId}
                onChange={handleMecanicoChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              >
                <option value="" disabled>Selecciona un mecánico...</option>
                {mecanicos.length > 0 ? (
                  mecanicos.map(mecanico => (
                    <option key={mecanico.id} value={mecanico.id}>
                      {mecanico.nombre}
                    </option>
                  ))
                ) : (
                  <option disabled>Cargando mecánicos...</option>
                )}
              </select>
              <button
                type="submit"
                disabled={isAssigning}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isAssigning ? 'Asignando...' : 'Confirmar y Asignar'}
              </button>
            </form>
          )}
          
          {/* --- VISTA 2: Formulario de Gestión (MECÁNICO) --- */}
          {esMecanico && (
            <form onSubmit={handleActualizarMecanico} className="bg-white p-6 rounded-lg shadow sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-green-600">Acción Requerida</h2>
              
              {/* Mensaje de solo lectura si está en el Pool */}
              {ot.estado === 'Pendiente' && (
                <p className="text-sm text-gray-700">Esta tarea está en el Pool. Esperando asignación de un supervisor.</p>
              )}
              
              {/* Selectores de estado (solo si puede editar) */}
              {puedeEditar && (
                <>
                  <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Actualizar Estado</label>
                  <select
                    id="estado" value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value as any)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900"
                  >
                    {/* El mecánico ahora ve 'Asignada' como su primer estado */}
                    {ot.estado === 'Asignada' && <option value="Asignada">Asignada (Sin Iniciar)</option>}
                    {(ot.estado === 'Asignada' || ot.estado === 'En Progreso') && <option value="En Progreso">En Progreso</option>}
                    {ot.estado === 'En Progreso' && <option value="Finalizado">Finalizar Trabajo</option>}
                    {ot.estado === 'Finalizado' && <option value="Finalizado">Finalizado</option>}
                  </select>
                  <button
                    type="submit"
                    disabled={isUpdating || ot.estado === 'Finalizado'}
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </>
              )}
              
              {/* Mensaje si la OT ya fue finalizada */}
              {ot.estado === 'Finalizado' && (
                 <p className="text-sm text-green-700">¡Trabajo finalizado! Pendiente de cierre administrativo.</p>
              )}
            </form>
          )}

          {/* --- VISTA 3: Solo Lectura (ADMIN) --- */}
          {isAdmin && ot.estado !== 'Pendiente' && (
             <div className="bg-white p-6 rounded-lg shadow sticky top-8">
               <h2 className="text-xl font-semibold mb-4 text-gray-700">Gestión de Tarea</h2>
               <p className="text-sm text-gray-600">
                 Esta tarea está {ot.estado}.
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
    </Fragment>
  );
}