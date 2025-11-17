// frontend/app/portal-conductor/page.tsx
// (CÓDIGO ACTUALIZADO CON DISEÑO PROFESIONAL, ESTILO PEPSI, Y CORRECCIÓN DE FECHA)

'use client'; 

import { useState, useEffect, useRef } from 'react'; 
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 
import Image from 'next/image'; 
import { ArrowPathIcon, MapPinIcon, WrenchScrewdriverIcon, ClockIcon } from '@heroicons/react/24/outline'; // Nuevos Iconos

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
  fechaSolicitud: { _seconds: number } | null; 
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
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

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

  const fetchMiVehiculo = async (conductorId: string) => {
    setLoadingVehiculo(true);
    try {
      // Esta API ya tiene la limpieza del ID implementada en la última corrección.
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

  const handleSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcionFalla || !userProfile || !miVehiculo) {
        toast.error('Falta la descripción de la falla.');
        return;
    }
    
    setIsSubmitting(true);
    
    const promise = (async () => {
      let fotoUrl = null;

      if (selectedFile) {
        const filename = `solicitud-${userProfile.id}/${Date.now()}-${selectedFile.name}`;
        const uploadResponse = await fetch(`/api/upload-foto?filename=${filename}`, { 
          method: 'POST', 
          body: selectedFile 
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Falló la subida de la foto.');
        }
        
        const newBlob = await uploadResponse.json();
        fotoUrl = newBlob.url; 
      }

      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_conductor: userProfile.id,
          nombre_conductor: userProfile.nombre,
          patente_vehiculo: miVehiculo.patente,
          descripcion_falla: descripcionFalla,
          fotoEvidenciaUrl: fotoUrl, 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Falló el envío de la solicitud');
      }
    })();

    toast.promise(promise, {
      loading: 'Enviando solicitud...',
      success: () => {
        setDescripcionFalla(''); 
        handleRemovePreview();
        fetchMisSolicitudes(userProfile.id); 
        setIsSubmitting(false);
        return '¡Solicitud enviada exitosamente!';
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.message || 'Ocurrió un error inesperado.';
      }
    });
  };
  
  const getEstadoConductor = (sol: SolicitudConEstado): { texto: string, color: string } => {
    if (sol.estadoOT === 'Cerrado') {
        return { texto: 'Finalizado y Archivado', color: 'text-gray-500' };
    }
    if (sol.estadoOT === 'Finalizado') {
      return { texto: '¡LISTO PARA RETIRO!', color: 'text-green-600 font-bold' };
    }
    if (sol.estadoOT === 'En Progreso' || sol.estadoOT === 'Pendiente') {
      return { texto: 'En Taller', color: 'text-yellow-600' };
    }
    
    // --- ¡CORRECCIÓN DE TIPADO EN LÍNEA 187 (Aprox)! ---
    // Usamos .includes para manejar la unión de tipos correctamente
    if (sol.estadoOT && ['Asignada', 'Agendado'].includes(sol.estadoOT)) {
        if (sol.fechaHoraAgendada?._seconds) {
            const fecha = new Date(sol.fechaHoraAgendada._seconds * 1000).toLocaleString('es-CL');
            return { texto: `Agendado para: ${fecha}`, color: 'text-pepsi-blue font-semibold' };
        }
        return { texto: 'Agendado (Esperando hora)', color: 'text-blue-600' };
    }
    // --- FIN CORRECCIÓN DE TIPADO ---

    if (sol.estadoSolicitud === 'Pendiente') {
      return { texto: 'Pendiente de Aprobación (Admin)', color: 'text-gray-500' };
    }
    return { texto: 'Procesado', color: 'text-gray-500' };
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; 
    }
  };

  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }
  
  return (
    <div className="p-8 text-neutral-900 max-w-6xl mx-auto space-y-8"> 
      
      <h1 className="text-3xl font-bold text-pepsi-blue flex items-center gap-3">
        <MapPinIcon className="h-7 w-7" />
        Portal del Conductor: {userProfile.nombre}
      </h1>
      <p className="text-neutral-700">Aquí puedes revisar la información de tu vehículo asignado y solicitar mantenimiento.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Columna Izquierda (Acciones) */}
        <div className="md:col-span-1 space-y-8">
          
          {/* SECCIÓN 1: Mi Vehículo */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-pepsi-blue flex items-center gap-2">
                <WrenchScrewdriverIcon className="h-5 w-5"/>
                Mi Vehículo Asignado
            </h2>
            {loadingVehiculo ? (
              <p>Buscando tu vehículo...</p>
            ) : miVehiculo ? (
              <div className="space-y-3">
                <div className="bg-pepsi-blue text-white p-3 rounded-md text-center">
                    <span className="text-sm font-light block">Patente Asignada</span>
                    <p className="font-bold text-2xl">{miVehiculo.patente}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 text-sm">
                  <div>
                    <span className="text-gray-500">Marca</span>
                    <p className="font-medium text-neutral-900">{miVehiculo.marca || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Modelo / Año</span>
                    <p className="font-medium text-neutral-900">{miVehiculo.modelo || 'N/A'} / {miVehiculo.año || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Tipo / Color</span>
                    <p className="font-medium text-neutral-900">{miVehiculo.tipo_vehiculo || 'N/A'} / {miVehiculo.color || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 font-semibold p-4 bg-red-50 border border-red-200 rounded-md">
                No tienes un vehículo asignado. Contacta a un administrador.
              </p>
            )}
          </div>

          {/* SECCIÓN 2: SOLICITAR MANTENIMIENTO */}
          {miVehiculo && (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-pepsi-blue flex items-center gap-2">
                <ArrowPathIcon className="h-5 w-5"/>
                Solicitar Mantenimiento
              </h2>
              <form onSubmit={handleSolicitud} className="space-y-4">
                <div>
                  <label htmlFor="descripcionFalla" className="block text-sm font-medium text-neutral-700 mb-1">
                    Describe la falla:
                  </label>
                  <textarea
                    id="descripcionFalla"
                    rows={4}
                    value={descripcionFalla}
                    onChange={(e) => setDescripcionFalla(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-neutral-900 bg-gray-50 focus:ring-pepsi-blue focus:border-pepsi-blue"
                    placeholder="Ej: Ruido extraño en el motor..."
                  />
                </div>
                
                {/* BLOQUE DE FOTO */}
                <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                  <p className="block text-sm font-medium text-neutral-700 mb-2">Adjuntar Foto (Opcional)</p>
                  
                  {previewUrl && (
                    <div className="mb-4 relative w-full">
                      <p className="text-xs font-medium text-neutral-700 mb-1">Previsualización:</p>
                      <Image 
                          src={previewUrl} 
                          alt="Previsualización" 
                          width={200} 
                          height={200} 
                          className="rounded-md object-cover max-h-40" 
                          style={{width: 'auto'}}
                      />
                      <button type="button" onClick={handleRemovePreview}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-pepsi-red text-white rounded-full w-6 h-6 flex items-center justify-center font-bold"
                      >&times;</button>
                    </div>
                  )}
                  
                  {!previewUrl && (
                    <input 
                      type="file" id="foto" 
                      ref={fileInputRef}
                      onChange={handleFileChange} 
                      accept="image/png, image/jpeg"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-pepsi-blue hover:file:bg-blue-100"
                    />
                  )}
                </div>
                {/* FIN BLOQUE DE FOTO */}
                
                <button
                  type="submit"
                  disabled={isSubmitting || !descripcionFalla}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-pepsi-red hover:bg-red-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Columna Derecha (Estado de Solicitudes) */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-pepsi-blue">
                <ClockIcon className="h-5 w-5 inline mr-2"/>
                Estado de mis Solicitudes
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Solicitud</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado Actual</th>
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
                            {/* --- ¡CORRECCIÓN DE FECHA ROBUSTA! --- */}
                            {sol.fechaSolicitud && sol.fechaSolicitud._seconds 
                              ? new Date(sol.fechaSolicitud._seconds * 1000).toLocaleString('es-CL')
                              : 'N/A'
                            }
                          </td>
                          <td className="px-6 py-4 text-neutral-700">{sol.descripcion}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${estado.color}`}>
                            {estado.texto}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={3} className="px-6 py-4 text-center text-neutral-700">No tienes solicitudes activas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}