'use client';
import { useState, useEffect, useRef, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Image from 'next/image';

// --- Iconos para la UI ---
import { 
  PaperAirplaneIcon, 
  TruckIcon, 
  ListBulletIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

// (Tipos de datos)
type Vehiculo = {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  año: number;
};

type Solicitud = {
  id: string;
  patente: string;
  descripcionProblema: string;
  estado: string;
  fechaCreacion: { _seconds: number };
  fotoUrl?: string;
  fechaHoraAgendada?: { _seconds: number };
};

// --- Estilo estándar para inputs (v3) ---
const inputStyle = "w-full px-4 py-3 border border-gray-300 rounded-md text-neutral-900 bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-pepsi-blue-light focus:border-transparent transition-shadow duration-200";

export default function PortalConductorPage() {
  
  // (Lógica de 'useState', 'useEffect' y 'fetch' idéntica)
  const [misVehiculos, setMisVehiculos] = useState<Vehiculo[]>([]);
  const [solicitudesPasadas, setSolicitudesPasadas] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPatente, setSelectedPatente] = useState('');
  const [descripcionProblema, setDescripcionProblema] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        if (userProfile.rol === 'Conductor') {
          fetchMisVehiculos(userProfile.id);
          fetchMisSolicitudes(userProfile.id);
        } else {
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchMisVehiculos = async (conductorId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vehiculos/por-conductor/${conductorId}`);
      if (!response.ok) {
        // Este es el "error" 404 que viste. 
        // No es un crash, solo informamos al usuario.
        console.warn(`No se encontraron vehículos para el conductor ${conductorId}`);
        setMisVehiculos([]); // Dejamos el array vacío
      } else {
        const data = await response.json();
        setMisVehiculos(data);
        if (data.length > 0) {
          setSelectedPatente(data[0].patente); // Selecciona el primer vehículo por defecto
        }
      }
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMisSolicitudes = async (conductorId: string) => {
    try {
      // Esta API sí funcionó (te dio 200 OK)
      const response = await fetch(`/api/solicitudes/por-conductor/${conductorId}`);
      if (!response.ok) throw new Error('No se pudieron cargar tus solicitudes');
      const data = await response.json();
      data.sort((a: Solicitud, b: Solicitud) => b.fechaCreacion._seconds - a.fechaCreacion._seconds);
      setSolicitudesPasadas(data);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  // (El resto de la lógica 'handleFileChange', 'handleRemovePreview' y 'handleSubmit' no cambia)
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatente || !descripcionProblema) {
      toast.error('Por favor, selecciona un vehículo y describe el problema.');
      return;
    }
    setIsSubmitting(true);
    let fotoUrl = '';
    if (selectedFile) {
      const toastId = toast.loading('Subiendo foto...');
      try {
        const filename = `solicitud-${userProfile?.id}/${Date.now()}-${selectedFile.name}`;
        const responseUpload = await fetch(`/api/upload-foto?filename=${filename}`, { method: 'POST', body: selectedFile });
        if (!responseUpload.ok) throw new Error('Falló la subida de la foto');
        const newBlob = await responseUpload.json();
        fotoUrl = newBlob.url;
        toast.dismiss(toastId);
      } catch (err) {
        if (err instanceof Error) toast.error(err.message);
        setIsSubmitting(false);
        toast.dismiss(toastId);
        return;
      }
    }
    const toastSubmitId = toast.loading('Enviando solicitud...');
    try {
      const responseSubmit = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_conductor: userProfile?.id,
          nombre_conductor: userProfile?.nombre,
          patente: selectedPatente,
          descripcionProblema: descripcionProblema,
          fotoUrl: fotoUrl,
        }),
      });
      if (!responseSubmit.ok) throw new Error('Error al enviar la solicitud');
      toast.success('¡Solicitud enviada exitosamente!', { id: toastSubmitId });
      setDescripcionProblema('');
      handleRemovePreview();
      fetchMisSolicitudes(userProfile!.id);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message, { id: toastSubmitId });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (authLoading || loading) {
    return <div className="p-8 font-sans">Cargando tu portal...</div>;
  }

  // --- JSX REFACTORIZADO VISUALMENTE ---
  return (
    <div className="p-8 font-sans">
      <h1 className="text-3xl font-bold text-pepsi-blue mb-6">Mi Portal de Conductor</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- Columna Izquierda: Formulario (2/3) --- */}
        <div className="lg:col-span-2 space-y-8">

          {/* Tarjeta 1: Nueva Solicitud */}
          <div className="bg-white p-8 rounded-lg shadow-card">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-neutral-900 mb-6">
              <PaperAirplaneIcon className="h-6 w-6 text-pepsi-blue" />
              Crear Nueva Solicitud
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selección de Vehículo */}
              <div>
                <label htmlFor="vehiculo" className="block text-sm font-medium text-neutral-700 mb-1">
                  Selecciona tu vehículo
                </label>
                <select
                  id="vehiculo"
                  value={selectedPatente}
                  onChange={(e) => setSelectedPatente(e.target.value)}
                  className={inputStyle} // Estilo estándar v3
                  // Se deshabilita si no hay vehículos
                  disabled={misVehiculos.length === 0} 
                >
                  {misVehiculos.length > 0 ? (
                    misVehiculos.map(v => (
                      <option key={v.id} value={v.patente}>
                        {v.patente} - {v.marca} {v.modelo} ({v.año})
                      </option>
                    ))
                  ) : (
                    // Este es el mensaje que deberías estar viendo
                    <option value="" disabled>No tienes vehículos asignados</option>
                  )}
                </select>
              </div>

              {/* Descripción del Problema */}
              <div>
                <label htmlFor="problema" className="block text-sm font-medium text-neutral-700 mb-1">
                  Describe el problema o motivo
                </label>
                <textarea
                  id="problema"
                  rows={4}
                  value={descripcionProblema}
                  onChange={(e) => setDescripcionProblema(e.target.value)}
                  className={inputStyle} // Estilo estándar v3
                  placeholder="Ej: Falla en el motor, ruido extraño en las ruedas, mantención preventiva..."
                />
              </div>

              {/* Subida de Foto */}
              <div>
                <label htmlFor="foto" className="block text-sm font-medium text-neutral-700 mb-1">
                  Adjuntar foto (Opcional)
                </label>
                {previewUrl && (
                  <div className="mb-4 relative w-40 h-40">
                    <Image src={previewUrl} alt="Previsualización" layout="fill" className="rounded-md object-cover" />
                    <button 
                      type="button" 
                      onClick={handleRemovePreview}
                      className="absolute -top-2 -right-2 bg-pepsi-red text-white rounded-full w-6 h-6 flex items-center justify-center font-bold"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  id="foto"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg"
                  className="block w-full text-sm text-neutral-700 file:mr-4 file:py-2 file:px-4
                             file:rounded-lg file:border-0 file:text-sm file:font-semibold
                             file:bg-pepsi-blue-light file:text-white
                             hover:file:bg-pepsi-blue-dark file:transition-colors file:duration-200"
                />
              </div>

              {/* Botón de Envío */}
              <button
                type="submit"
                disabled={isSubmitting || misVehiculos.length === 0} // Se deshabilita si no hay vehículos
                className="w-full flex justify-center items-center gap-2 bg-pepsi-blue text-white py-3 rounded-md font-semibold 
                           hover:bg-pepsi-blue-dark transition-colors duration-200 disabled:bg-gray-400"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </form>
          </div>

          {/* Tarjeta 2: Historial de Solicitudes */}
          <div className="bg-white rounded-lg shadow-card overflow-hidden">
            <div className="p-6">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-neutral-900 mb-4">
                <ListBulletIcon className="h-6 w-6 text-pepsi-blue" />
                Mis Solicitudes Pasadas
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Patente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {solicitudesPasadas.length > 0 ? (
                    solicitudesPasadas.map(s => (
                      <tr key={s.id}>
                        <td className="px-6 py-4 font-medium text-neutral-900">{s.patente}</td>
                        <td className="px-6 py-4 text-neutral-700">
                          {new Date(s.fechaCreacion._seconds * 1000).toLocaleDateString('es-CL')}
                        </td>
                        <td className="px-6 py-4 text-neutral-700">{s.descripcionProblema}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            s.estado === 'Completado' || s.estado === 'Cerrado' ? 'bg-green-100 text-green-800' :
                            s.estado === 'Agendado' ? 'bg-blue-100 text-pepsi-blue-light' :
                            s.estado === 'En Progreso' ? 'bg-yellow-100 text-yellow-800' :
                            s.estado === 'Pendiente' ? 'bg-red-100 text-pepsi-red' :
                            'bg-neutral-100 text-neutral-900'
                          }`}>
                            {s.estado === 'Completado' ? 'Finalizado' : s.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="p-4 text-center text-neutral-700">No tienes solicitudes anteriores.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* --- Columna Derecha: Info (1/3) --- */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-card sticky top-24">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-neutral-900 mb-4">
              <TruckIcon className="h-6 w-6 text-pepsi-blue" />
              Mis Vehículos
            </h2>
            {/* Aquí es donde se maneja el 404 */}
            {misVehiculos.length > 0 ? (
              <ul className="space-y-3">
                {misVehiculos.map(v => (
                  <li key={v.id} className="p-3 bg-neutral-50 rounded-md border border-neutral-100">
                    <p className="font-bold text-neutral-900">{v.patente}</p>
                    <p className="text-sm text-neutral-700">{v.marca} {v.modelo} ({v.año})</p>
                  </li>
                ))}
              </ul>
            ) : (
              // Este es el mensaje que deberías ver si la API devuelve 404
              <p className="text-neutral-700">No tienes vehículos asignados.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}