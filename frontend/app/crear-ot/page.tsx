'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Importamos el DatePicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // CSS base del DatePicker

// (Tipos de datos originales)
type HoraAgendada = {
  id: string;
  patente: string;
  fechaHoraAgendada: { _seconds: number };
};

// --- ¡Estilos estándar para inputs (v3)! ---
const inputStyle = "w-full px-4 py-3 border border-gray-300 rounded-md text-neutral-900 bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-pepsi-blue-light focus:border-transparent transition-shadow duration-200";
const disabledInputStyle = "w-full px-4 py-3 border border-gray-300 rounded-md text-neutral-700 bg-neutral-100 cursor-not-allowed";

export default function CrearOTForm() {
  
  // (Toda la lógica de 'useState', 'useEffect' y 'fetch' queda idéntica)
  const [patente, setPatente] = useState('');
  const [descripcionProblema, setDescripcionProblema] = useState('');
  const [fechaHoraAgendada, setFechaHoraAgendada] = useState<Date | null>(null);
  
  const [idConductor, setIdConductor] = useState<string | null>(null);
  const [nombreConductor, setNombreConductor] = useState<string | null>(null);
  const [solicitudId, setSolicitudId] = useState<string | null>(null);

  const [horasOcupadasHoy, setHorasOcupadasHoy] = useState<HoraAgendada[]>([]);
  const [loadingHoras, setLoadingHoras] = useState(true);

  const [loading, setLoading] = useState(false);
  const router = useRouter(); 
  const { user, userProfile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams(); 

  useEffect(() => {
    // Leemos los datos de la URL (enviados desde Bandeja de Taller)
    setPatente(searchParams.get('patente') || '');
    setDescripcionProblema(searchParams.get('motivo') || '');
    setIdConductor(searchParams.get('id_conductor'));
    setNombreConductor(searchParams.get('nombre_conductor'));
    setSolicitudId(searchParams.get('solicitud_id'));

    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchHorasAgendadasHoy();
        } else {
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router, searchParams]);
  
  const fetchHorasAgendadasHoy = async () => {
    setLoadingHoras(true);
    try {
      const response = await fetch('/api/ordenes-trabajo');
      if (!response.ok) throw new Error('No se pudieron cargar las horas');
      const data: HoraAgendada[] = await response.json();
      
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      const filtradas = data.filter(ot => {
        if (!ot.fechaHoraAgendada) return false;
        const fechaCita = new Date(ot.fechaHoraAgendada._seconds * 1000);
        return fechaCita >= hoy && fechaCita < mañana;
      });
      setHorasOcupadasHoy(filtradas);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoadingHoras(false);
    }
  };

  const handleCrearOT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patente || !fechaHoraAgendada) {
      toast.error('La Patente y la Fecha/Hora son obligatorias.');
      return;
    }
    setLoading(true);
    
    const promise = fetch('/api/ordenes-trabajo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patente,
        descripcionProblema,
        fechaHoraAgendada,
        id_conductor: idConductor,
        nombre_conductor: nombreConductor,
        solicitud_id: solicitudId, // ID de la solicitud original
        estado: 'Agendado', // Estado inicial
      }),
    });

    toast.promise(promise, {
      loading: 'Agendando OT...',
      success: (res) => {
        if (!res.ok) throw new Error('Error al agendar la OT');
        setLoading(false);
        router.push('/agenda-taller'); // Redirige a la agenda
        return '¡OT agendada exitosamente!';
      },
      error: (err) => {
        setLoading(false);
        return err.message || 'Error al agendar';
      }
    });
  };

  const horasExcluidas = horasOcupadasHoy.map(
    ot => new Date(ot.fechaHoraAgendada._seconds * 1000)
  );

  if (authLoading || !userProfile) {
    return <div className="p-8 font-sans">Validando sesión y permisos...</div>;
  }

  // --- JSX REFACTORIZADO VISUALMENTE ---
  return (
    <div className="p-8 font-sans">
      
      {/* Contenedor que agrupa el formulario y la disponibilidad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

        {/* --- Columna Izquierda: Formulario (Tarjeta Blanca) --- */}
        <div className="md:col-span-2 bg-white p-8 rounded-lg shadow-card">
          {/* Título usa el color pepsi-blue */}
          <h1 className="text-3xl font-bold text-pepsi-blue mb-6">
            Agendar Nueva OT
          </h1>
          <form onSubmit={handleCrearOT} className="space-y-6">
            
            {nombreConductor && (
              <div>
                <label htmlFor="conductor" className="block text-sm font-medium text-neutral-700 mb-1">Solicitante (Conductor)</label>
                <input
                  type="text" id="conductor" value={nombreConductor}
                  disabled
                  className={disabledInputStyle} // ¡Estilo estándar aplicado!
                />
              </div>
            )}
            
            <div>
              <label htmlFor="patente" className="block text-sm font-medium text-neutral-700 mb-1">Patente</label>
              <input
                type="text" id="patente" value={patente}
                onChange={(e) => setPatente(e.target.value)}
                disabled={!!solicitudId} // Se deshabilita si viene de una solicitud
                className={!!solicitudId ? disabledInputStyle : inputStyle} // ¡Estilo estándar aplicado!
              />
            </div>
            
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-neutral-700 mb-1">Descripción / Motivo</label>
              <textarea
                id="descripcion" value={descripcionProblema}
                onChange={(e) => setDescripcionProblema(e.target.value)}
                rows={4}
                className={inputStyle} // ¡Estilo estándar aplicado!
              />
            </div>
            
            <div>
              <label htmlFor="fechaHoraAgendada" className="block text-sm font-medium text-neutral-700 mb-1">
                Fecha y Hora de Agendamiento
              </label>
              {/* Este componente usa automáticamente los estilos de globals.css */}
              <DatePicker
                selected={fechaHoraAgendada}
                onChange={(date: Date | null) => setFechaHoraAgendada(date)}
                showTimeSelect 
                timeIntervals={30} 
                excludeTimes={horasExcluidas} // Excluye horas ocupadas
                minDate={new Date()} 
                dateFormat="dd/MM/yyyy HH:mm" 
                className="mt-1" // El estilo base viene de globals.css
                wrapperClassName="w-full" // Asegura que ocupe todo el ancho
                placeholderText="Selecciona fecha y hora..."
              />
            </div>

            {/* --- Botones de Acción (Rediseñados) --- */}
            <div className="flex justify-end space-x-4 pt-4">
              <Link 
                href="/solicitudes-pendientes"
                className="px-5 py-2 rounded-md text-neutral-900 bg-neutral-100 hover:bg-neutral-200 font-medium transition-colors duration-200"
              >
                Cancelar
              </Link>
              
              <button
                type="submit"
                disabled={loading || loadingHoras}
                className="px-5 py-2 rounded-md text-white bg-pepsi-blue hover:bg-pepsi-blue-dark font-medium transition-colors duration-200 disabled:bg-gray-400"
              >
                {loading ? 'Guardando...' : 'Agendar OT'}
              </button>
            </div>
            
          </form>
        </div>
        
        {/* --- Columna Derecha: Disponibilidad (Tarjeta Blanca) --- */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-card h-fit sticky top-24">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Disponibilidad (Hoy)
          </h2>
          {loadingHoras ? (
            <p className="text-neutral-700">Cargando disponibilidad...</p>
          ) : horasOcupadasHoy.length > 0 ? (
            <ul className="space-y-3">
              {horasOcupadasHoy.map(ot => (
                <li key={ot.id} className="flex justify-between items-center p-3 bg-neutral-100 rounded-md border border-neutral-100">
                  <span className="font-semibold text-pepsi-red text-lg">
                    OCUPADO: {new Date(ot.fechaHoraAgendada._seconds * 1000).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-neutral-700">{ot.patente}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-700">No hay horas agendadas para hoy.</p>
          )}
        </div>

      </div>
    </div>
  );
}