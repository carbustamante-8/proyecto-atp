// frontend/app/portal-conductor/page.tsx
// (CÓDIGO ACTUALIZADO: Añadida la subida de fotos y correcciones defensivas)

'use client'; 

import { useState, useEffect, useRef } from 'react'; // ¡Añadido useRef!
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 
import Image from 'next/image'; // ¡Añadido Image!

// (Tipo VehiculoAsignado - sin cambios)
type VehiculoAsignado = {
  id: string;
  patente: string;
  modelo: string;
  marca: string;
  año: number;
  tipo_vehiculo: string;
  estado: string;
  color?: string;
  vin?: string;
  n_motor?: string;
  n_chasis?: string;
  pais_manufactura?: string;
  tipo_combustible?: string;
};

// (Tipo SolicitudConEstado - sin cambios)
type SolicitudConEstado = {
  id: string;
  descripcion: string;
  fechaSolicitud: { _seconds: number } | null; // Acepta null
  estadoSolicitud: 'Pendiente' | 'Procesado';
  estadoOT: 'Agendado' | 'Pendiente' | 'En Progreso' | 'Finalizado' | 'Cerrado' | 'Anulado' | null;
  fechaHoraAgendada?: { _seconds: number } | null; 
};

export default function PortalConductorPage() {
  
  const [miVehiculo, setMiVehiculo] = useState<VehiculoAsignado | null>(null);
  const [loadingVehiculo, setLoadingVehiculo] = useState(true);
  const [descripcionFalla, setDescripcionFalla] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [misSolicitudes, setMisSolicitudes] = useState<SolicitudConEstado[]>([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
  
  // --- ¡NUEVO! Estados para Fotos ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // (useEffect - sin cambios)
  useEffect(() => {
    if (authLoading) {
      return; 
    }
    if (user && userProfile) {
      if (userProfile.rol === 'Conductor') {
        fetchMiVehiculo(userProfile.id); 
        fetchMisSolicitudes(userProfile.id);
      } else {
        toast.error('Acceso denegado');
        router.push('/'); 
      }
    } else {
      router.push('/');
    }
  }, [user, userProfile, authLoading, router]);

  // (fetchMiVehiculo - sin cambios)
  const fetchMiVehiculo = async (conductorId: string) => {
    setLoadingVehiculo(true);
    try {
      const response = await fetch(`/api/vehiculos/por-conductor/${conductorId}`);
      if (response.status === 404) {
        setMiVehiculo(null);
      } else if (response.ok) {
        setMiVehiculo(await response.json());
      } else {
        throw new Error('No se pudo cargar tu vehículo');
      }
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoadingVehiculo(false);
    }
  };
  
  // (fetchMisSolicitudes - sin cambios)
  const fetchMisSolicitudes = async (conductorId: string) => {
    setLoadingSolicitudes(true);
    try {
      const response = await fetch(`/api/solicitudes/por-conductor/${conductorId}`);
      if (!response.ok) throw new Error('No se pudieron cargar tus solicitudes');
      const data: SolicitudConEstado[] = await response.json();
      const solicitudesActivas = data.filter(sol => {
        if (sol.estadoOT === 'Cerrado' || sol.estadoOT === 'Anulado') {
          return false; 
        }
        return true; 
      });
      setMisSolicitudes(solicitudesActivas); 
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  // --- ¡handleSolicitud (ACTUALIZADO)! ---
  const handleSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcionFalla || !userProfile || !miVehiculo) return;
    
    setIsSubmitting(true);
    
    // Usamos toast.promise para manejar todo el flujo
    const promise = (async () => {
      let fotoUrl = null;

      // 1. Si hay un archivo, subirlo primero
      if (selectedFile) {
        const filename = `solicitud-${userProfile.id}/${Date.now()}-${selectedFile.name}`;
        // Llama a la API de subida
        const uploadResponse = await fetch(`/api/upload-foto?filename=${filename}`, { 
          method: 'POST', 
          body: selectedFile 
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Falló la subida de la foto.');
        }
        
        const newBlob = await uploadResponse.json();
        fotoUrl = newBlob.url; // Guarda la URL de Vercel Blob
      }

      // 2. Crear la solicitud con la URL de la foto (o null)
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_conductor: userProfile.id,
          nombre_conductor: userProfile.nombre,
          patente_vehiculo: miVehiculo.patente,
          descripcion_falla: descripcionFalla,
          fotoEvidenciaUrl: fotoUrl, // ¡Enviamos la URL!
        }),
      });
      
      if (!response.ok) {
        throw new Error('Falló el envío de la solicitud');
      }
    })();

    // Manejador del Toast
    toast.promise(promise, {
      loading: 'Enviando solicitud...',
      success: () => {
        setDescripcionFalla(''); 
        handleRemovePreview(); // Limpia la foto
        fetchMisSolicitudes(userProfile.id); // Refresca la lista
        setIsSubmitting(false);
        return '¡Solicitud enviada exitosamente!';
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.message || 'Ocurrió un error inesperado.';
      }
    });
  };
  
  // (getEstadoConductor - sin cambios)
  const getEstadoConductor = (sol: SolicitudConEstado): { texto: string, color: string } => {
    if (sol.estadoOT === 'Finalizado') {
      return { texto: '¡LISTO PARA RETIRO!', color: 'text-green-600 font-bold' };
    }
    if (sol.estadoOT === 'En Progreso') {
      return { texto: 'En Taller (En Progreso)', color: 'text-yellow-600' };
    }
    if (sol.estadoOT === 'Pendiente') {
      return { texto: 'En Taller (Pendiente de Mecánico)', color: 'text-yellow-600' };
    }
    if (sol.estadoOT === 'Agendado' && sol.fechaHoraAgendada && typeof sol.fechaHoraAgendada === 'object' && sol.fechaHoraAgendada._seconds) {
      const fecha = new Date(sol.fechaHoraAgendada._seconds * 1000).toLocaleString('es-CL');
      return { texto: `Agendado para: ${fecha}`, color: 'text-blue-600' };
    }
    if (sol.estadoOT === 'Agendado') {
      return { texto: 'Agendado (Esperando hora)', color: 'text-blue-600' };
    }
    if (sol.estadoSolicitud === 'Pendiente') {
      return { texto: 'Pendiente de Aprobación (Admin)', color: 'text-gray-500' };
    }
    return { texto: 'Procesado', color: 'text-gray-500' };
  };

  // --- ¡NUEVAS FUNCIONES DE FOTO! ---
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

  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }
  
  return (
    <div className="p-8 text-gray-900 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"> 
      
      {/* Columna Izquierda (Acciones) */}
      <div className="md:col-span-1 space-y-8">
        
        {/* (Sección 1: Mi Vehículo - sin cambios) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Mi Vehículo Asignado</h2>
          {loadingVehiculo ? (
            <p>Buscando tu vehículo...</p>
          ) : miVehiculo ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2">
                <span className="text-sm text-gray-500">Patente</span>
                <p className="font-medium text-lg">{miVehiculo.patente}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Marca</span>
                <p className="font-medium">{miVehiculo.marca || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Modelo</span>
                <p className="font-medium">{miVehiculo.modelo || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Año</span>
                <p className="font-medium">{miVehiculo.año || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Color</span>
                <p className="font-medium">{miVehiculo.color || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-gray-500">Tipo de Vehículo</span>
                <p className="font-medium">{miVehiculo.tipo_vehiculo || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-gray-500">VIN</span>
                <p className="font-medium">{miVehiculo.vin || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">N° Motor</span>
                <p className="font-medium">{miVehiculo.n_motor || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">N° Chasis</span>
                <p className="font-medium">{miVehiculo.n_chasis || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Combustible</span>
                <p className="font-medium">{miVehiculo.tipo_combustible || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Origen</span>
                <p className="font-medium">{miVehiculo.pais_manufactura || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-700">No tienes un vehículo asignado.</p>
          )}
        </div>

        {/* --- SECCIÓN 2: SOLICITAR MANTENIMIENTO (ACTUALIZADA) --- */}
        {miVehiculo && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">Solicitar Mantenimiento</h2>
            <form onSubmit={handleSolicitud} className="space-y-4">
              <div>
                <label htmlFor="descripcionFalla" className="block text-sm font-medium text-gray-700">
                  Describe la falla o el mantenimiento requerido:
                </label>
                <textarea
                  id="descripcionFalla"
                  rows={4}
                  value={descripcionFalla}
                  onChange={(e) => setDescripcionFalla(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
                  placeholder="Ej: Ruido extraño en el motor..."
                />
              </div>
              
              {/* --- ¡NUEVO BLOQUE DE FOTO! --- */}
              <div className="border border-gray-200 p-4 rounded-lg">
                <label htmlFor="foto" className="block text-sm font-medium text-gray-700 mb-2">
                  Adjuntar Foto (Opcional)
                </label>
                
                {previewUrl && (
                  <div className="mb-4 relative w-1/2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Previsualización:</p>
                    <Image src={previewUrl} alt="Previsualización" width={150} height={150} className="rounded-md object-cover" />
                    <button type="button" onClick={handleRemovePreview}
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold"
                    >&times;</button>
                  </div>
                )}
                
                {!previewUrl && (
                  <input 
                    type="file" id="foto" 
                    ref={fileInputRef}
                    onChange={handleFileChange} 
                    accept="image/png, image/jpeg"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                )}
              </div>
              {/* --- FIN BLOQUE DE FOTO --- */}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* (Columna Derecha: Estado de Solicitudes - sin cambios) */}
      <div className="md:col-span-2">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Estado de mis Solicitudes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Solicitud</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingSolicitudes ? (
                  <tr><td colSpan={3} className="px-6 py-4 text-center">Cargando solicitudes...</td></tr>
                ) : misSolicitudes.length > 0 ? (
                  misSolicitudes.map(sol => {
                    const estado = getEstadoConductor(sol); 
                    return (
                      <tr key={sol.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {/* --- ¡CORRECCIÓN DE VULNERABILIDAD DE FECHA! --- */}
                          {sol.fechaSolicitud?._seconds 
                            ? new Date(sol.fechaSolicitud._seconds * 1000).toLocaleString('es-CL')
                            : 'N/A'
                          }
                          {/* --- FIN CORRECCIÓN --- */}
                        </td>
                        <td className="px-6 py-4">{sol.descripcion}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${estado.color}`}>
                          {estado.texto}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={3} className="px-6 py-4 text-center">No tienes solicitudes activas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}