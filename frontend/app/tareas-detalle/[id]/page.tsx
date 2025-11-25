'use client'; 
import { useState, useEffect, useRef, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; 

// --- ¡NUEVO! Iconos para una UI profesional ---
import { 
  ArrowLeftIcon, 
  UserPlusIcon, 
  CameraIcon, 
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// --- ¡CORREGIDO! Tipos originales restaurados ---
type DetalleOrdenDeTrabajo = {
  id: string;
  patente: string;
  descripcionProblema: string; 
  estado: 'Agendado' | 'Pendiente' | 'Asignada' | 'En Progreso' | 'Finalizado' | 'Cerrado' | 'Anulado';
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

type VehiculoDetalles = {
  id: string;
  marca: string;
  modelo: string;
  año: number;
  vin?: string;
  n_motor?: string;
  n_chasis?: string;
  color?: string;
  tipo_combustible?: string;
  pais_manufactura?: string;
};

// --- ¡NUEVO! Estilos estándar para formularios (v3) ---
const inputStyle = "w-full px-4 py-3 border border-gray-300 rounded-md text-neutral-900 bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-pepsi-blue-light focus:border-transparent transition-shadow duration-200";
const disabledInputStyle = "w-full px-4 py-3 border border-gray-300 rounded-md text-neutral-700 bg-neutral-100 cursor-not-allowed";

export default function DetalleOTPage() {
  
  // (Estados originales restaurados)
  const params = useParams();
  const id = params.id as string; 
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth(); 

  const [ot, setOt] = useState<DetalleOrdenDeTrabajo | null>(null);
  const [loading, setLoading] = useState(true); 
  const [vehiculoDetalles, setVehiculoDetalles] = useState<VehiculoDetalles | null>(null);
  const [loadingVehiculo, setLoadingVehiculo] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<'Asignada' | 'En Progreso' | 'Finalizado'>('Asignada');
  const [repuestosUsados, setRepuestosUsados] = useState(''); 
  const [isUpdating, setIsUpdating] = useState(false); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); 
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [mecanicoAsignadoId, setMecanicoAsignadoId] = useState('');
  const [mecanicoAsignadoNombre, setMecanicoAsignadoNombre] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // (Lógica de 'useEffect' original restaurada)
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador', 'Mecánico'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchDetalleOT();
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
  
  // --- ¡CORREGIDO! Lógica original de funciones restaurada ---
  const fetchDetalleOT = async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true); 
    try {
      const response = await fetch(`/api/ordenes-trabajo/${id}`);
      if (!response.ok) throw new Error('No se pudo cargar la OT');
      const data: DetalleOrdenDeTrabajo = await response.json();
      setOt(data); 
      
      if (data.estado === 'Asignada' || data.estado === 'En Progreso' || data.estado === 'Finalizado') {
        setNuevoEstado(data.estado);
      }
      if (data.repuestosUsados) setRepuestosUsados(data.repuestosUsados);

      if (data.patente) {
        fetchVehiculoPorPatente(data.patente);
      }
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchVehiculoPorPatente = async (patente: string) => {
    setLoadingVehiculo(true);
    try {
      const response = await fetch(`/api/vehiculos/por-patente/${patente}`);
      if (!response.ok) {
        setVehiculoDetalles(null);
      } else {
        const data = await response.json();
        setVehiculoDetalles(data);
      }
    } catch (err) {
      console.error("Error al buscar vehículo por patente:", err);
      setVehiculoDetalles(null);
    } finally {
      setLoadingVehiculo(false);
    }
  };

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

  const handleActualizarMecanico = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsUpdating(true);
    const body = { estado: nuevoEstado, repuestosUsados: repuestosUsados };
    try {
      const response = await fetch(`/api/ordenes-trabajo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('No se pudo actualizar el estado');
      toast.success('¡OT actualizada!'); 
      if (nuevoEstado === 'Finalizado') {
        router.push('/mis-tareas'); 
      } else {
        await fetchDetalleOT(); 
      }
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
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
    if (fileInputRef.current) fileInputRef.current.value = ''; 
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
        accion: 'asignarTarea', 
        mecanicoAsignadoId: mecanicoAsignadoId,
        mecanicoAsignadoNombre: mecanicoAsignadoNombre,
      }),
    });
    toast.promise(promise, {
      loading: 'Asignando OT...',
      success: (res) => {
        if (!res.ok) throw new Error('No se pudo asignar la OT');
        fetchDetalleOT(); 
        setIsAssigning(false);
        return `¡OT Asignada a ${mecanicoAsignadoNombre}!`;
      },
      error: (err) => {
        setIsAssigning(false);
        return err.message || 'No se pudo asignar la OT';
      }
    });
  };
  const handleCierreAdministrativo = async () => {
    setIsClosing(true);
    const promise = fetch(`/api/ordenes-trabajo/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: 'Cerrado',
        accion: 'cierreAdministrativo'
      }),
    });
    toast.promise(promise, {
      loading: 'Cerrando OT...',
      success: (res) => {
        if (!res.ok) throw new Error('Error al cerrar la OT');
        setIsClosing(false);
        router.push('/cierre-ots'); 
        return '¡OT Cerrada Administrativamente!';
      },
      error: (err) => {
        setIsClosing(false);
        return err.message || 'Error al cerrar la OT';
      }
    });
  };
  // --- FIN DE LÓGICA RESTAURADA ---
  
  
  if (authLoading || !userProfile || loading) {
    return <div className="p-8 font-sans">Validando sesión y cargando OT...</div>;
  }
  if (!ot) return <div className="p-8 font-sans">OT no encontrada.</div>;

  // (Lógica de permisos no cambia)
  const esMecanico = userProfile.rol === 'Mecánico';
  const isAdmin = ['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol);
  const puedeEditar = esMecanico && 
                      ot.mecanicoAsignadoId === userProfile.id && 
                      (ot.estado === 'Asignada' || ot.estado === 'En Progreso');
  const showAdminAssignForm = isAdmin && ot.estado === 'Pendiente';
  const showWorkView = esMecanico || isAdmin;
  const showAdminCloseForm = isAdmin && ot.estado === 'Finalizado';
  const showAdminReadOnlyView = isAdmin && 
                                ot.estado !== 'Pendiente' && 
                                ot.estado !== 'Finalizado';

  // --- JSX REFACTORIZADO VISUALMENTE ---
  return (
    <Fragment>
    
{/* --- Modal Definitivo (A prueba de fallos) --- */}
      {fotoAmpliada && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setFotoAmpliada(null)}
        >
          {/* Botones Superiores */}
          <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: '15px', zIndex: 100000 }}>
            
            {/* BOTÓN SALVAVIDAS: Abre la foto en una pestaña nueva */}
            <a 
              href={fotoAmpliada} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="bg-pepsi-blue text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-blue-700 no-underline flex items-center"
            >
              Abrir Original ↗
            </a>

            <button 
              onClick={() => setFotoAmpliada(null)} 
              className="bg-pepsi-red text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-red-700"
            >
              Cerrar X
            </button>
          </div>

          <img 
            src={fotoAmpliada} 
            alt="Evidencia ampliada"
            style={{ 
              maxWidth: '90vw', 
              maxHeight: '80vh', 
              objectFit: 'contain', 
              border: '1px solid #444',
              borderRadius: '8px'
            }}
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
      {/* Contenedor principal de la página */}
      <div className="p-8 font-sans max-w-7xl mx-auto">
        
        {showWorkView ? (
          <>
            {/* --- Encabezado de Página --- */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-pepsi-blue">Detalle de OT-{ot.id.substring(0, 6)}</h1>
              
              <button
                onClick={() => router.back()} 
                className="inline-flex items-center gap-1 text-pepsi-blue-light hover:text-pepsi-blue-dark font-medium transition-colors duration-200 mt-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Volver al listado
              </button>
            </div>

            {/* --- Grid de 2 Columnas --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* --- Columna Izquierda (Información) --- */}
              <div className="md:col-span-2 space-y-6"> 
                
                {/* Tarjeta de Detalles del Vehículo */}
                <div className="bg-white p-6 rounded-lg shadow-card">
                  <h2 className="text-xl font-bold text-neutral-900 mb-4">Detalles del Vehículo</h2>
                  {loadingVehiculo ? ( <p>Cargando detalles...</p> ) : 
                   vehiculoDetalles ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-neutral-700">Marca</span>
                        <p className="font-medium text-neutral-900">{vehiculoDetalles.marca || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-700">Modelo</span>
                        <p className="font-medium text-neutral-900">{vehiculoDetalles.modelo || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-700">Año</span>
                        <p className="font-medium text-neutral-900">{vehiculoDetalles.año || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-700">Color</span>
                        <p className="font-medium text-neutral-900">{vehiculoDetalles.color || 'N/A'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-sm text-neutral-700">VIN</span>
                        <p className="font-medium text-neutral-900">{vehiculoDetalles.vin || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-700">N° Motor</span>
                        <p className="font-medium text-neutral-900">{vehiculoDetalles.n_motor || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-700">N° Chasis</span>
                        <p className="font-medium text-neutral-900">{vehiculoDetalles.n_chasis || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-700">Combustible</span>
                        <p className="font-medium text-neutral-900">{vehiculoDetalles.tipo_combustible || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-neutral-700">Origen</span>
                        <p className="font-medium text-neutral-900">{vehiculoDetalles.pais_manufactura || 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-neutral-700">No se encontraron detalles adicionales para esta patente.</p>
                  )}
                </div>
                
                {/* Tarjeta de Información de la OT */}
                <div className="bg-white p-6 rounded-lg shadow-card">
                  <h2 className="text-xl font-bold text-neutral-900 mb-4">Información de la OT</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-neutral-700">Patente</span>
                      <p className="font-medium text-lg">{ot.patente}</p>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-700">Estado Actual</span>
                      <p className={`font-bold text-lg ${
                          ot.estado === 'Finalizado' ? 'text-green-600' :
                          ot.estado === 'Cerrado' ? 'text-neutral-700' :
                          ot.estado === 'En Progreso' ? 'text-yellow-500' :
                          ot.estado === 'Asignada' ? 'text-pepsi-blue-light' : 
                          ot.estado === 'Pendiente' ? 'text-pepsi-red' :
                          'text-gray-400' 
                      }`}>
                        {ot.estado}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-700">Mecánico Asignado</span>
                      <p className={`font-medium text-lg ${!ot.mecanicoAsignadoNombre ? 'text-pepsi-red' : 'text-neutral-900'}`}>
                        {ot.mecanicoAsignadoNombre || 'SIN ASIGNAR'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-neutral-700">Descripción del Problema</span>
                      <p className="text-neutral-900">{ot.descripcionProblema}</p>
                    </div>
                  </div>
                </div>
                
                {/* Tarjeta de Registro de Trabajo */}
                <div className="bg-white p-6 rounded-lg shadow-card">
                  <h2 className="text-xl font-bold text-neutral-900 mb-4">Registro de Trabajo (Mecánico)</h2>
                  <div>
                    <label htmlFor="repuestos" className="block text-sm font-medium text-neutral-700 mb-1">Repuestos Utilizados / Trabajo Realizado</label>
                    <textarea
                      id="repuestos" rows={4}
                      className={puedeEditar ? inputStyle : disabledInputStyle} // Estilo estándar
                      placeholder={puedeEditar ? "Ej: 1x Filtro de aceite (Código 1234)..." : "Solo el mecánico asignado puede editar."}
                      value={repuestosUsados}
                      onChange={(e) => setRepuestosUsados(e.target.value)}
                      disabled={!puedeEditar} 
                    />
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900 mt-6 mb-4">Evidencia Fotográfica</h2>
                  
                  {/* Formulario de Subida de Foto */}
                  {puedeEditar && (
                    <div className="border border-neutral-100 p-4 rounded-lg bg-neutral-50">
                      {previewUrl && (
                        <div className="mb-4 relative w-1/2">
                          <p className="text-sm font-medium text-gray-700 mb-2">Previsualización:</p>
                          <Image src={previewUrl} alt="Previsualización" width={200} height={200} className="rounded-md object-cover" />
                          <button type="button" onClick={handleRemovePreview}
                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-pepsi-red text-white rounded-full w-6 h-6 flex items-center justify-center font-bold"
                          >&times;</button>
                        </div>
                      )}
                      {!previewUrl && (
                        <div className="mb-4">
                          <label htmlFor="foto" className="block text-sm font-medium text-neutral-700 mb-1">Seleccionar foto...</label>
                          <input type="file" id="foto" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg"
                            className="block w-full text-sm text-neutral-700 file:mr-4 file:py-2 file:px-4
                                       file:rounded-lg file:border-0 file:text-sm file:font-semibold
                                       file:bg-pepsi-blue-light file:text-white
                                       hover:file:bg-pepsi-blue-dark file:transition-colors file:duration-200"
                          />
                        </div>
                      )}
                      <button type="button" onClick={handleFileUpload} disabled={isUploading || !selectedFile}
                        className="inline-flex items-center gap-2 bg-pepsi-blue-light text-white px-4 py-2 rounded-md 
                                   hover:bg-pepsi-blue-dark transition-colors duration-200 disabled:bg-gray-400"
                      >
                        <CameraIcon className="h-5 w-5" />
                        {isUploading ? 'Subiendo...' : 'Subir Foto'}
                      </button>
                    </div>
                  )}
                  
                  {/* Galería de Fotos */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-neutral-900">Fotos Subidas:</h3>
                    {ot.fotos && ot.fotos.length > 0 ? (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {ot.fotos.map((fotoUrl, index) => (
                          <div 
                            key={index} 
                            className="relative w-full h-40 rounded-lg overflow-hidden shadow-sm border border-neutral-100 
                                       cursor-pointer transition-transform-shadow duration-200 transform 
                                       hover:shadow-card-hover hover:border-pepsi-blue-light hover:-translate-y-1"
                            onClick={() => setFotoAmpliada(fotoUrl)}
                          >
                            <img 
                              src={fotoUrl} 
                              alt={`Evidencia ${index + 1}`} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-neutral-700">Aún no se han subido fotos.</p>
                    )}
                  </div>
                </div>
                
              </div>
              
              {/* --- Columna Derecha (Acciones) --- */}
              <div className="col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-card sticky top-24">
                  
                  {/* --- VISTA 1: Formulario de Asignación (ADMIN) --- */}
                  {showAdminAssignForm && (
                    <form onSubmit={handleAsignarOT} className="space-y-4">
                      <h2 className="text-xl font-bold text-pepsi-blue">Asignar Tarea</h2>
                      <p className="text-sm text-neutral-700">Esta OT está en el Pool. Asigna un mecánico para que pueda empezar.</p>
                      <div>
                        <label htmlFor="mecanico" className="block text-sm font-medium text-neutral-700 mb-1">Asignar a Mecánico</label>
                        <select
                          id="mecanico"
                          value={mecanicoAsignadoId}
                          onChange={handleMecanicoChange}
                          className={inputStyle} // Estilo estándar
                        >
                          <option value="" disabled>Selecciona un mecánico...</option>
                          {mecanicos.map(mecanico => (
                            <option key={mecanico.id} value={mecanico.id}>
                              {mecanico.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isAssigning}
                        className="w-full flex justify-center items-center gap-2 bg-pepsi-blue text-white py-3 rounded-md font-semibold 
                                   hover:bg-pepsi-blue-dark transition-colors duration-200 disabled:bg-gray-400"
                      >
                        <UserPlusIcon className="h-5 w-5" />
                        {isAssigning ? 'Asignando...' : 'Confirmar y Asignar'}
                      </button>
                    </form>
                  )}
                  
                  {/* --- VISTA 2: Formulario de Gestión (MECÁNICO) --- */}
                  {esMecanico && (
                    <form onSubmit={handleActualizarMecanico} className="space-y-4">
                      <h2 className="text-xl font-bold text-green-600">Acción Requerida</h2>
                      
                      {ot.estado === 'Pendiente' && (
                        <p className="text-sm text-neutral-700">Esta tarea está en el Pool. Esperando asignación de un supervisor.</p>
                      )}
                      
                      {puedeEditar && (
                        <>
                          <div>
                            <label htmlFor="estado" className="block text-sm font-medium text-neutral-700 mb-1">Actualizar Estado</label>
                            <select
                              id="estado" value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value as any)}
                              className={inputStyle} // Estilo estándar
                            >
                              <option value="Asignada">Asignada (Sin Iniciar)</option>
                              <option value="En Progreso">En Progreso</option>
                              <option value="Finalizado">Finalizar Trabajo</option>
                            </select>
                          </div>
                          <button
                            type="submit"
                            disabled={isUpdating || ot.estado === 'Finalizado'}
                            className="w-full bg-pepsi-blue text-white py-3 rounded-md font-semibold 
                                       hover:bg-pepsi-blue-dark transition-colors duration-200 disabled:bg-gray-400"
                          >
                            {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                          </button>
                        </>
                      )}
                      
                      {ot.estado === 'Finalizado' && (
                         <p className="text-sm text-green-700 font-medium">¡Trabajo finalizado! Pendiente de cierre administrativo.</p>
                      )}
                    </form>
                  )}

                  {/* --- VISTA 4: Formulario de Cierre (ADMIN) --- */}
                  {showAdminCloseForm && (
                     <div className="space-y-4">
                       <h2 className="text-xl font-bold text-green-600">Revisión Final</h2>
                       <p className="text-sm text-neutral-700">
                         El mecánico ha marcado esta OT como 'Finalizado'. Revisa el trabajo, las fotos y los repuestos.
                       </p>
                       <button
                          type="button"
                          onClick={handleCierreAdministrativo}
                          disabled={isClosing}
                          className="w-full flex justify-center items-center gap-2 bg-green-600 text-white py-3 rounded-md font-semibold 
                                     hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                          {isClosing ? 'Cerrando...' : 'Cerrar OT (Archivar)'}
                        </button>
                     </div>
                  )}

                  {/* --- VISTA 3: Solo Lectura (ADMIN) --- */}
                  {showAdminReadOnlyView && (
                     <div>
                       <h2 className="text-xl font-bold text-neutral-900 mb-4">Gestión de Tarea</h2>
                       <p className="text-sm text-neutral-700">
                         Esta tarea está <strong className="font-semibold">{ot.estado}</strong>.
                       </p>
                       {ot.mecanicoAsignadoNombre && (
                         <p className="text-sm text-neutral-700 mt-2">
                           Tomada por: <strong className="text-neutral-900">{ot.mecanicoAsignadoNombre}</strong>
                         </p>
                       )}
                     </div>
                  )}
                  
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-3">
            <p className="text-pepsi-red">No tienes permiso para ver esta OT.</p>
          </div>
        )}
      </div>
    </Fragment>
  );
}