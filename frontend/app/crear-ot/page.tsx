// frontend/app/crear-ot/page.tsx
// (CÓDIGO ACTUALIZADO: Implementa bloqueo de 1 hora y persistencia)

'use client'; 
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; 

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type HoraAgendada = {
  id: string;
  patente: string;
  fechaHoraAgendada: { _seconds: number };
  estado: string; // ¡Necesario para la persistencia!
};

function CrearOTForm() {
  
  const [patente, setPatente] = useState('');
  const [descripcionProblema, setDescripcionProblema] = useState('');
  const [fechaHoraAgendada, setFechaHoraAgendada] = useState<Date | null>(null);
  
  const [idConductor, setIdConductor] = useState<string | null>(null);
  const [nombreConductor, setNombreConductor] = useState<string | null>(null);
  const [solicitudId, setSolicitudId] = useState<string | null>(null);

  // --- ¡ACTUALIZADO! Ahora guarda todas las horas ocupadas ---
  const [horasOcupadasHoy, setHorasOcupadasHoy] = useState<HoraAgendada[]>([]);
  const [loadingHoras, setLoadingHoras] = useState(true);

  const [loading, setLoading] = useState(false);
  const router = useRouter(); 
  const { user, userProfile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams(); 

  // (useEffect - sin cambios)
  useEffect(() => {
    setPatente(searchParams.get('patente') || '');
    setDescripcionProblema(searchParams.get('motivo') || '');
    setIdConductor(searchParams.get('id_conductor'));
    setNombreConductor(searchParams.get('nombre_conductor'));
    setSolicitudId(searchParams.get('solicitud_id'));

    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (!rolesPermitidos.includes(userProfile.rol)) {
          router.push('/');
        } else {
          fetchHorasOcupadasDelDia(); // Renombrada
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router, searchParams]);
  
  // --- ¡fetchHoras (ACTUALIZADO)! ---
  const fetchHorasOcupadasDelDia = async () => {
    setLoadingHoras(true);
    try {
      const response = await fetch('/api/ordenes-trabajo');
      if (!response.ok) throw new Error('No se pudo cargar la disponibilidad');
      const data = await response.json();

      const hoyInicio = new Date();
      hoyInicio.setHours(0, 0, 0, 0);
      const hoyFin = new Date();
      hoyFin.setHours(23, 59, 59, 999);

      const agendadasHoy = data.filter((ot: any) => {
        // --- ¡LÓGICA DE PERSISTENCIA! ---
        // La hora se considera "ocupada" si NO está Cerrada o Anulada
        const estaActiva = ot.estado !== 'Cerrado' && ot.estado !== 'Anulado';
        
        if (!estaActiva || !ot.fechaHoraAgendada?._seconds) {
          return false;
        }
        
        // Y si la cita es para hoy
        const fechaCita = new Date(ot.fechaHoraAgendada._seconds * 1000);
        return fechaCita >= hoyInicio && fechaCita <= hoyFin;
      });
      
      agendadasHoy.sort((a: any, b: any) => a.fechaHoraAgendada._seconds - b.fechaHoraAgendada._seconds);
      setHorasOcupadasHoy(agendadasHoy);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoadingHoras(false);
    }
  };
  
  // (handleCrearOT - sin cambios)
  const handleCrearOT = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!patente || !descripcionProblema || !fechaHoraAgendada) {
      toast.error('Completa Patente, Descripción y Fecha/Hora.');
      return;
    }
    if (fechaHoraAgendada < new Date()) {
      toast.error('La fecha de agendamiento no puede ser en el pasado.');
      return;
    }
    setLoading(true);
    
    const promise = (async () => {
      const otResponse = await fetch('/api/ordenes-trabajo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patente,
          descripcionProblema,
          fechaHoraAgendada: fechaHoraAgendada, 
          id_conductor: idConductor,
          nombre_conductor: nombreConductor,
        }),
      });
      if (!otResponse.ok) throw new Error('Falló la creación de la OT');
      const nuevaOT = await otResponse.json();

      if (solicitudId) {
        const solResponse = await fetch('/api/solicitudes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: solicitudId,
            estado: 'Procesado',
            id_ot_relacionada: nuevaOT.id 
          }),
        });
        if (!solResponse.ok) throw new Error('OT creada, pero falló al actualizar la solicitud.');
      }
    })();

    toast.promise(promise, {
      loading: 'Agendando OT...',
      success: () => {
        router.push('/solicitudes-pendientes'); 
        return '¡OT Agendada exitosamente!';
      },
      error: (err) => {
        setLoading(false);
        return err.message;
      }
    });
  };

  // --- ¡NUEVA LÓGICA DE BLOQUEO! ---
  // 1. Obtiene las horas de inicio
  const horasOcupadas = horasOcupadasHoy.map(
    ot => new Date(ot.fechaHoraAgendada._seconds * 1000)
  );
  
  // 2. Crea la lista de bloqueo (bloquea la hora Y la siguiente media hora)
  const horasParaExcluir: Date[] = [];
  horasOcupadas.forEach(hora => {
    // Añade la hora de inicio (ej: 11:00)
    horasParaExcluir.push(hora);
    
    // Añade la siguiente media hora (ej: 11:30)
    const siguienteMediaHora = new Date(hora.getTime() + 30 * 60000); 
    horasParaExcluir.push(siguienteMediaHora);
  });
  // --- FIN LÓGICA DE BLOQUEO ---


  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-50 p-8">
      <div className="w-full max-w-lg mx-auto">
        
        {/* Formulario */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Agendar Nueva OT
          </h1>
          <form onSubmit={handleCrearOT} className="space-y-6">
            
            {/* (Inputs Patente y Descripción - sin cambios) */}
            <div>
              <label htmlFor="patente" className="block text-sm font-medium text-gray-700">Patente</label>
              <input
                type="text" id="patente" value={patente}
                onChange={(e) => setPatente(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              />
            </div>
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción / Motivo</label>
              <textarea
                id="descripcion" value={descripcionProblema}
                onChange={(e) => setDescripcionProblema(e.target.value)}
                rows={4}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              />
            </div>
            
            {/* --- ¡DATEPICKER ACTUALIZADO CON BLOQUEO! --- */}
            <div>
              <label htmlFor="fechaHoraAgendada" className="block text-sm font-medium text-gray-700">
                Fecha y Hora de Agendamiento
              </label>
              <DatePicker
                selected={fechaHoraAgendada}
                onChange={(date: Date | null) => setFechaHoraAgendada(date)}
                showTimeSelect 
                timeIntervals={30} // Intervalos de 30 min
                
                // ¡BLOQUEA LAS HORAS!
                excludeTimes={horasParaExcluir} 
                
                minDate={new Date()} // No agendar en el pasado
                dateFormat="dd/MM/yyyy HH:mm" 
                
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
                wrapperClassName="w-full"
                placeholderText="Selecciona fecha y hora..."
              />
            </div>

            {/* (Botones - sin cambios) */}
            <div className="space-y-4 pt-4">
              <button
                type="submit"
                disabled={loading || loadingHoras}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Guardando...' : 'Agendar OT'}
              </button>
              <button
                type="button" 
                onClick={() => router.push('/solicitudes-pendientes')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
            
          </form>
        </div>
        
        {/* --- Lista de Horas (ACTUALIZADA) --- */}
        <div className="bg-white p-8 rounded-lg shadow-lg mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Horas Ocupadas (Hoy)
          </h2>
          {loadingHoras ? (
            <p className="text-gray-500">Cargando disponibilidad...</p>
          ) : horasOcupadasHoy.length > 0 ? (
            <ul className="space-y-3">
              {horasOcupadasHoy.map(ot => (
                <li key={ot.id} className="flex justify-between items-center p-3 bg-gray-100 rounded-md">
                  <span className="font-semibold text-red-600 text-lg">
                    {/* Muestra la hora y el estado */}
                    OCUPADO ({ot.estado}): {new Date(ot.fechaHoraAgendada._seconds * 1000).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-gray-700">{ot.patente}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No hay horas agendadas para hoy.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// (Wrapper sin cambios)
export default function CrearOTPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <CrearOTForm />
    </Suspense>
  );
}