// frontend/app/tareas-detalle/[id]/page.tsx
// (CÓDIGO ACTUALIZADO: Vistas dinámicas para Diagnóstico, Aprobación y Ejecución)

'use client'; 
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; 

// --- Tipos de Datos (Actualizados) ---
type DetalleOrdenDeTrabajo = {
  id: string;
  patente: string;
  descripcionProblema: string; 
  // ¡Nuevos estados del flujo completo!
  estado: 'Pendiente Diagnóstico' | 'Pendiente Aprobación' | 'Pendiente' | 'En Progreso' | 'Finalizado';
  fechaCreacion: any; 
  repuestosUsados?: string;
  fotos?: string[]; 
  mecanicoAsignadoId?: string | null;
  mecanicoAsignadoNombre?: string | null;
};

type Mecanico = {
  id: string;
  nombre: string;
};

export default function DetalleOTPage() {
  
  const params = useParams();
  const id = params.id as string; 
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth(); 

  // --- Estados de la OT ---
  const [ot, setOt] = useState<DetalleOrdenDeTrabajo | null>(null);
  const [loading, setLoading] = useState(true); 
  
  // --- Estados para MODO MECÁNICO (CU-08) ---
  const [nuevoEstado, setNuevoEstado] = useState<'Pendiente' | 'En Progreso' | 'Finalizado'>('Pendiente');
  const [repuestosUsados, setRepuestosUsados] = useState(''); 
  const [isUpdating, setIsUpdating] = useState(false); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false); 

  // --- Estados para MODO DIAGNÓSTICO (CU-05) ---
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [mecanicoAsignadoId, setMecanicoAsignadoId] = useState('');
  const [mecanicoAsignadoNombre, setMecanicoAsignadoNombre] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // --- Estados para MODO APROBACIÓN (CU-06) ---
  const [isApproving, setIsApproving] = useState(false);

  // --- 1. Función de Carga (re-usable) ---
  const fetchDetalleOT = async () => {
    if (!id || id === 'undefined') { setLoading(false); return; }
    setLoading(true); 
    try {
      const response = await fetch(`/api/ordenes-trabajo/${id}`);
      if (!response.ok) throw new Error('No se pudo cargar la OT');
      const data: DetalleOrdenDeTrabajo = await response.json();
      
      setOt(data); 
      
      // Configura estados para MODO MECÁNICO
      if (data.estado !== 'Pendiente Diagnóstico' && data.estado !== 'Pendiente Aprobación') {
        setNuevoEstado(data.estado);
      }
      if (data.repuestosUsados) setRepuestosUsados(data.repuestosUsados);
      
      // Configura estados para MODO ADMIN
      if (data.mecanicoAsignadoId) setMecanicoAsignadoId(data.mecanicoAsignadoId);
      if (data.mecanicoAsignadoNombre) setMecanicoAsignadoNombre(data.mecanicoAsignadoNombre);
      
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // --- 2. Carga de Mecánicos (solo para Admins) ---
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

  // --- 3. useEffect (Protección y Carga Inicial) ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesAdmin = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        
        if (rolesAdmin.includes(userProfile.rol)) {
          fetchDetalleOT(); // Carga la OT
          fetchMecanicos(); // Carga mecánicos para el selector
        } else if (userProfile.rol === 'Mecánico') {
          fetchDetalleOT(); // Carga la OT
        } else {
          router.push('/'); // Rol no permitido
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router, id]);

  // --- 4. Funciones de MODO MECÁNICO (CU-08) ---
  const handleActualizarMecanico = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await fetch(`/api/ordenes-trabajo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: nuevoEstado, 
          repuestosUsados: repuestosUsados, 
        }),
      });
      toast.success('¡OT actualizada!'); 
      router.push('/mis-tareas');
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsUpdating(false);
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
  
  // --- 5. Funciones de MODO DIAGNÓSTICO (CU-05) ---
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
    try {
      await fetch(`/api/ordenes-trabajo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mecanicoAsignadoId: mecanicoAsignadoId,
          mecanicoAsignadoNombre: mecanicoAsignadoNombre,
          // La API la pasará a estado "Pendiente Aprobación"
        }),
      });
      toast.success(`¡OT asignada! Pendiente de aprobación.`); 
      router.push('/pendientes-diagnostico'); // Vuelve a la bandeja
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  // --- 6. ¡NUEVO! Funciones de MODO APROBACIÓN (CU-06) ---
  const handleAprobarRechazar = async (accion: 'aprobar' | 'rechazar') => {
    setIsApproving(true);
    const toastMsg = accion === 'aprobar' ? 'OT Aprobada.' : 'OT Rechazada.';
    const errorMsg = accion === 'aprobar' ? 'Error al aprobar.' : 'Error al rechazar.';
    
    try {
      await fetch(`/api/ordenes-trabajo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: accion }), // La API entiende esto
      });
      toast.success(toastMsg);
      router.push('/pendientes-diagnostico'); // Vuelve a la bandeja
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
      else toast.error(errorMsg);
    } finally {
      setIsApproving(false);
    }
  };

  // --- 7. Lógica de Renderizado Temprano ---
  if (authLoading || !userProfile || loading) {
    return <div className="p-8 text-gray-900">Validando sesión y cargando OT...</div>;
  }
  if (!ot) return <div className="p-8 text-gray-900">OT no encontrada.</div>;

  // --- 8. Determinar qué vista mostrar ---
  const esMecanico = userProfile.rol === 'Mecánico';
  const esJefeTaller = userProfile.rol === 'Jefe de Taller';
  const esSupervisor = userProfile.rol === 'Supervisor';
  const esCoordinador = userProfile.rol === 'Coordinador';
  
  // VISTA DE DIAGNÓSTICO (CU-05)
  const showAdminAssignForm = (esJefeTaller || esCoordinador) && ot.estado === 'Pendiente Diagnóstico';
  
  // ¡NUEVA VISTA DE APROBACIÓN! (CU-06)
  const showSupervisorApprovalForm = (esSupervisor || esCoordinador) && ot.estado === 'Pendiente Aprobación';

  // VISTA DE EJECUCIÓN (CU-08)
  const showMechanicForm = esMecanico && ['Pendiente', 'En Progreso', 'Finalizado'].includes(ot.estado);
  
  // VISTA DE SOLO LECTURA (Admins viendo OTs que no les toca gestionar)
  const showReadOnlyView = 
    ((esJefeTaller || esCoordinador) && (ot.estado !== 'Pendiente Diagnóstico')) ||
    (esSupervisor && (ot.estado !== 'Pendiente Aprobación'));


  // --- RENDERIZADO DE LA PÁGINA ---
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
                ot.estado === 'Pendiente' ? 'text-blue-600' :
                ot.estado === 'Pendiente Aprobación' ? 'text-yellow-500' :
                'text-red-600' // Pendiente Diagnóstico
              }`}>
                {ot.estado}
              </p>
            </div>
            {ot.mecanicoAsignadoNombre && (
              <div>
                <span className="text-sm text-gray-500">Mecánico Asignado</span>
                <p className="font-medium text-lg">{ot.mecanicoAsignadoNombre}</p>
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
              disabled={!showMechanicForm} // Solo el mecánico edita
            />
          </div>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Evidencia Fotográfica</h2>
          {showMechanicForm && (
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

      {/* Columna Derecha (Acciones Dinámicas) */}
      <div className="col-span-1">
        
        {/* --- VISTA 1: Formulario de Asignación (JEFE DE TALLER / CU-05) --- */}
        {showAdminAssignForm && (
          <form onSubmit={handleAsignarOT} className="bg-white p-6 rounded-lg shadow sticky top-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">Diagnóstico y Asignación</h2>
            <p className="text-sm text-gray-600 mb-4">Asigna esta OT a un mecánico para enviar a aprobación del Supervisor.</p>
            <label htmlFor="mecanico" className="block text-sm font-medium text-gray-700">Asignar a Mecánico</label>
            <select
              id="mecanico" value={mecanicoAsignadoId} onChange={handleMecanicoChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            >
              <option value="" disabled>Selecciona un mecánico...</option>
              {mecanicos.map(mecanico => (<option key={mecanico.id} value={mecanico.id}>{mecanico.nombre}</option>))}
            </select>
            <button
              type="submit" disabled={isAssigning}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isAssigning ? 'Enviando...' : 'Enviar a Aprobación'}
            </button>
          </form>
        )}

        {/* --- ¡NUEVO! VISTA 2: Formulario de Aprobación (SUPERVISOR / CU-06) --- */}
        {showSupervisorApprovalForm && (
          <div className="bg-white p-6 rounded-lg shadow sticky top-8">
            <h2 className="text-xl font-semibold mb-4 text-yellow-600">Aprobación de Tarea</h2>
            <p className="text-sm text-gray-600 mb-4">
              El Jefe de Taller ha asignado esta OT a <strong className="text-gray-900">{ot.mecanicoAsignadoNombre}</strong>.
            </p>
            <p className="text-sm text-gray-600 mb-4">¿Apruebas esta asignación?</p>
            <div className="flex space-x-4">
              <button
                type="button" onClick={() => handleAprobarRechazar('rechazar')} disabled={isApproving}
                className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                {isApproving ? '...' : 'Rechazar'}
              </button>
              <button
                type="button" onClick={() => handleAprobarRechazar('aprobar')} disabled={isApproving}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {isApproving ? '...' : 'Aprobar'}
              </button>
            </div>
          </div>
        )}

        {/* --- VISTA 3: Formulario de Gestión (MECÁNICO / CU-08) --- */}
        {showMechanicForm && (
          <form onSubmit={handleActualizarMecanico} className="bg-white p-6 rounded-lg shadow sticky top-8">
            <h2 className="text-xl font-semibold mb-4 text-green-600">Mi Trabajo</h2>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Actualizar Estado</label>
            <select
              id="estado" value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value as any)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900"
              // Solo puede cambiar si no está finalizado
              disabled={ot.estado === 'Finalizado'}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Finalizado">Finalizado</option>
            </select>
            <button
              type="submit" disabled={isUpdating || ot.estado === 'Finalizado'}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        )}
        
        {/* --- VISTA 4: Solo Lectura (ADMINS) --- */}
        {showReadOnlyView && (
           <div className="bg-white p-6 rounded-lg shadow sticky top-8">
             <h2 className="text-xl font-semibold mb-4 text-gray-700">OT En Curso</h2>
             <p className="text-sm text-gray-600">
               Esta OT está siendo gestionada por <strong className="text-gray-900">{ot.mecanicoAsignadoNombre || 'el mecánico'}</strong>.
             </p>
             <p className="text-sm text-gray-600 mt-2">
               Estado actual: <strong className="text-gray-900">"{ot.estado}"</strong>.
             </p>
           </div>
        )}
        
      </div>
    </div>
  );
}