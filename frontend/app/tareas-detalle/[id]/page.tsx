'use client'; 
import { useState, useEffect, Fragment, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; 
import { ArrowLeftIcon, UserPlusIcon, CheckCircleIcon, CameraIcon } from '@heroicons/react/24/outline';

// --- TIPOS DE DATOS ---
type DetalleOrdenDeTrabajo = { 
  id: string; 
  patente: string; 
  descripcionProblema: string; 
  estado: any; 
  fechaCreacion: any; 
  repuestosUsados?: string; 
  fotos?: string[]; 
  mecanicoAsignadoId?: string; 
  mecanicoAsignadoNombre?: string; 
};
type Mecanico = { id: string; nombre: string; };
type VehiculoDetalles = { id: string; marca: string; modelo: string; año: number; vin?: string; color?: string; };

const inputStyle = "w-full px-4 py-3 border border-gray-300 rounded-md text-neutral-900 bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-pepsi-blue-light transition-shadow";

export default function DetalleOTPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth(); 
  const id = params.id as string;

  const [ot, setOt] = useState<DetalleOrdenDeTrabajo | null>(null);
  const [loading, setLoading] = useState(true); 
  const [vehiculoDetalles, setVehiculoDetalles] = useState<VehiculoDetalles | null>(null);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  
  // Estados de Formulario
  const [repuestosUsados, setRepuestosUsados] = useState(''); 
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [mecanicoAsignadoId, setMecanicoAsignadoId] = useState('');
  
  // Estados de Acción
  const [isUpdating, setIsUpdating] = useState(false); 
  const [isAssigning, setIsAssigning] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // --- CARGA DE DATOS ---
  const fetchVehiculo = async (patente: string) => {
    try {
        const res = await fetch(`/api/vehiculos/por-patente/${patente}`);
        if (res.ok) setVehiculoDetalles(await res.json());
    } catch {}
  };

  const fetchMecanicos = async () => {
    const res = await fetch('/api/usuarios');
    if (res.ok) {
        const users = await res.json();
        setMecanicos(users.filter((u: any) => u.rol === 'Mecánico' && u.estado === 'Activo'));
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ordenes-trabajo/${id}`);
      if (res.ok) {
          const data = await res.json();
          setOt(data);
          setNuevoEstado(data.estado);
          setRepuestosUsados(data.repuestosUsados || '');
          if (data.patente) fetchVehiculo(data.patente);
      }
      if (['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile?.rol || '')) {
          fetchMecanicos();
      }
    } catch (e) { toast.error('Error cargando datos'); } 
    finally { setLoading(false); }
  }, [id, userProfile]);

  useEffect(() => {
    if (!authLoading && user && userProfile) {
        fetchData();
    } else if (!authLoading && !user) {
        router.push('/');
    }
  }, [user, userProfile, authLoading, fetchData, router]);

  // --- ACCIONES ---

  const manejarSubida = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setSubiendoFoto(true);
    const toastId = toast.loading('Subiendo evidencia...');
    
    try {
      const filename = `ot-${id}-${Date.now()}.jpg`;
      const res = await fetch(`/api/upload-foto?filename=${filename}`, { 
        method: 'POST', 
        body: e.target.files[0] 
      });
      
      if (!res.ok) throw new Error('Error al subir');
      const blob = await res.json();

      await fetch(`/api/ordenes-trabajo/${id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ nuevaFotoURL: blob.url }) 
      });

      toast.success('Foto agregada', { id: toastId });
      fetchData(); 
    } catch { 
      toast.error('Error al subir', { id: toastId }); 
    } finally { 
      setSubiendoFoto(false); 
      e.target.value = ''; 
    }
  };

  const guardarCambios = async (e: React.FormEvent) => {
      e.preventDefault(); 
      setIsUpdating(true);
      try {
          await fetch(`/api/ordenes-trabajo/${id}`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ estado: nuevoEstado, repuestosUsados }) 
          });
          toast.success('Guardado correctamente');
          if (nuevoEstado === 'Finalizado') router.push('/mis-tareas'); 
          else fetchData(); 
      } catch { toast.error('Error al guardar'); } finally { setIsUpdating(false); }
  };

  const asignarMecanico = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsAssigning(true);
      try {
          await fetch(`/api/ordenes-trabajo/${id}`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                accion: 'asignarTarea', 
                mecanicoAsignadoId,
                estado: 'Asignada' 
            }) 
          });
          toast.success('Asignado'); fetchData();
      } catch { toast.error('Error al asignar'); } finally { setIsAssigning(false); }
  };

  const cerrarOT = async () => {
      setIsClosing(true);
      try {
        await fetch(`/api/ordenes-trabajo/${id}`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ estado: 'Cerrado', accion: 'cierreAdministrativo' }) 
        });
        toast.success('OT Cerrada'); router.push('/cierre-ots');
      } catch { setIsClosing(false); }
  };

  if (loading || !ot || !userProfile) return <div className="p-8 font-sans">Cargando...</div>;

  const esMecanico = userProfile.rol === 'Mecánico';
  const isAdmin = ['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol);
  const puedeEditar = esMecanico && ot.mecanicoAsignadoId === userProfile.id && (ot.estado === 'Asignada' || ot.estado === 'En Progreso');
  
  // CONDICIÓN CLAVE: ¿Mostrar el Registro de Trabajo?
  // Solo si NO es pendiente (es decir, ya empezó el trabajo)
  const mostrarRegistroTrabajo = ot.estado !== 'Pendiente';

  return (
    <Fragment>
      <div className="p-8 font-sans max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-pepsi-blue">OT-{ot.id.substring(0, 6)}</h1>
            <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-600 hover:text-pepsi-blue">
                <ArrowLeftIcon className="h-5 w-5"/> Volver
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* COLUMNA IZQUIERDA: DATOS */}
            <div className="md:col-span-2 space-y-6">
                
                {/* TARJETA VEHÍCULO (Siempre Visible) */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">Detalles del Vehículo</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><p className="text-gray-500">Patente</p><p className="font-semibold text-lg">{ot.patente}</p></div>
                        {vehiculoDetalles && (
                            <>
                                <div><p className="text-gray-500">Modelo</p><p className="font-medium">{vehiculoDetalles.marca} {vehiculoDetalles.modelo}</p></div>
                                <div><p className="text-gray-500">Año</p><p className="font-medium">{vehiculoDetalles.año}</p></div>
                            </>
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-gray-500 text-sm">Problema Reportado:</p>
                        <p className="text-gray-900 mt-1">{ot.descripcionProblema}</p>
                    </div>
                </div>

                {/* TARJETA TRABAJO (OCULTA EN PENDIENTE) */}
                {mostrarRegistroTrabajo && (
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                            <CameraIcon className="h-6 w-6 text-pepsi-blue"/> Registro de Trabajo
                        </h2>
                        
                        <label className="block text-sm font-medium text-gray-700 mb-2">Repuestos y Comentarios:</label>
                        <textarea 
                            rows={5} 
                            className={inputStyle} 
                            placeholder="Describa el trabajo realizado..." 
                            value={repuestosUsados} 
                            onChange={e => setRepuestosUsados(e.target.value)} 
                            disabled={!puedeEditar} 
                        />
                        
                        {/* SECCIÓN FOTOS */}
                        <div className="mt-6 border-t pt-4">
                            <p className="text-sm font-bold text-gray-800 mb-3">Evidencia Fotográfica</p>
                            
                            {/* BOTÓN DE SUBIDA (Solo Mecánico) */}
                            {puedeEditar && (
                                <div className="mb-4">
                                    <label className={`flex items-center justify-center w-full p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${subiendoFoto ? 'bg-gray-100' : 'hover:bg-blue-50 border-pepsi-blue'}`}>
                                        <div className="text-center">
                                            {subiendoFoto ? (
                                                <span className="text-gray-500 font-medium text-sm">Subiendo...</span>
                                            ) : (
                                                <span className="text-pepsi-blue font-medium text-sm">+ Adjuntar Foto de Trabajo</span>
                                            )}
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={manejarSubida} disabled={subiendoFoto} />
                                    </label>
                                </div>
                            )}

                            {/* GALERÍA DE FOTOS (Visible para Admin y Mecánico cuando hay trabajo) */}
                            {ot.fotos && ot.fotos.length > 0 ? (
                                <div className="grid grid-cols-3 gap-3">
                                    {ot.fotos.map((url, i) => (
                                        <a 
                                            key={i} 
                                            href={url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="group block h-24 rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg relative"
                                            title="Clic para ver original"
                                        >
                                            <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="evidencia" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">VER</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic text-center py-2">Sin evidencia adjunta.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* COLUMNA DERECHA: PANELES */}
            <div className="col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 sticky top-24">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">
                        Estado: <span className={`
                            ${ot.estado === 'Pendiente' ? 'text-red-500' : ''}
                            ${ot.estado === 'Asignada' ? 'text-blue-500' : ''}
                            ${ot.estado === 'En Progreso' ? 'text-yellow-600' : ''}
                            ${ot.estado === 'Finalizado' ? 'text-green-600' : ''}
                        `}>{ot.estado}</span>
                    </h2>
                    
                    {/* Mecánico */}
                    {esMecanico && puedeEditar && (
                        <form onSubmit={guardarCambios} className="space-y-4">
                            <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)} className={inputStyle}>
                                <option value="Asignada">Por Iniciar</option>
                                <option value="En Progreso">En Progreso</option>
                                <option value="Finalizado">Finalizar Trabajo</option>
                            </select>
                            <button disabled={isUpdating} className="w-full bg-pepsi-blue text-white py-2 rounded font-bold hover:bg-blue-700 transition-colors">
                                {isUpdating ? 'Guardando...' : 'Guardar Avance'}
                            </button>
                        </form>
                    )}

                    {/* Admin Asignar */}
                    {!esMecanico && isAdmin && ot.estado === 'Pendiente' && (
                        <form onSubmit={asignarMecanico} className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">Mecánico:</label>
                            <select value={mecanicoAsignadoId} onChange={e => setMecanicoAsignadoId(e.target.value)} className={inputStyle} required>
                                <option value="">-- Seleccionar --</option>
                                {mecanicos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                            </select>
                            <button disabled={isAssigning} className="w-full bg-pepsi-blue text-white py-2 rounded font-bold hover:bg-blue-700 transition-colors">
                                {isAssigning ? 'Asignando...' : 'Asignar OT'}
                            </button>
                        </form>
                    )}

                    {/* Admin Cerrar */}
                    {isAdmin && ot.estado === 'Finalizado' && (
                        <div className="space-y-4">
                            <div className="bg-green-50 p-3 rounded border border-green-200">
                                <p className="text-sm text-green-700 font-medium">Trabajo finalizado.</p>
                            </div>
                            <button onClick={cerrarOT} disabled={isClosing} className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition-colors flex justify-center gap-2">
                                <CheckCircleIcon className="h-5 w-5"/>
                                {isClosing ? 'Procesando...' : 'Aprobar y Cerrar'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </Fragment>
  );
}