// frontend/app/control-acceso/page.tsx
// (CÓDIGO ACTUALIZADO: Rediseñado a "Lista de Verificación de Agendados")

'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; 

// --- Tipo de Dato ---
type OrdenAgendada = {
  id: string;
  patente: string;
  descripcionProblema: string;
  fechaCreacion: { _seconds: number };
};

export default function ControlAccesoPage() {
  
  // --- Estados ---
  const [otsAgendadas, setOtsAgendadas] = useState<OrdenAgendada[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState(''); // Estado para el filtro de búsqueda
  const [actualizandoId, setActualizandoId] = useState<string | null>(null); // Para deshabilitar botón
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- Lógica de Protección y Carga ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        if (userProfile.rol === 'Guardia') {
          // Carga las OTs pendientes de llegada
          fetchOtsAgendadas();
        } else {
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // --- Función de Carga de Datos ---
  const fetchOtsAgendadas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo'); // Trae todas las OTs
      if (!response.ok) throw new Error('No se pudieron cargar las OTs agendadas');
      
      const data: any[] = await response.json();
      
      // Filtra solo las que están 'Agendado'
      const agendadas = data.filter(ot => ot.estado === 'Agendado');
      setOtsAgendadas(agendadas);

    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Acción del Botón "Registrar Llegada" ---
  const handleRegistrarLlegada = async (otId: string) => {
    setActualizandoId(otId); // Bloquea este botón
    try {
      const response = await fetch(`/api/ordenes-trabajo/${otId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'Pendiente', // El nuevo estado
          accion: 'registrarLlegada' // El flag de seguridad de la API
        }),
      });

      if (!response.ok) throw new Error('Error al registrar la llegada');
      
      toast.success('¡Llegada registrada! La OT fue enviada al pool del taller.');
      
      // Refresca la lista (quitando la OT que acaba de registrar)
      setOtsAgendadas(actuales => actuales.filter(ot => ot.id !== otId));

    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setActualizandoId(null); // Desbloquea el botón (en caso de error)
    }
  };

  // --- Lógica de Renderizado ---
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }
  
  // Filtra las OTs según la búsqueda (en mayúsculas y sin espacios)
  const otsFiltradas = otsAgendadas.filter(ot => 
    ot.patente.replace(/\s+/g, '').toUpperCase()
    .includes(busqueda.replace(/\s+/g, '').toUpperCase())
  );

  return (
    <div className="p-8 text-gray-900">
      
      <h1 className="text-3xl font-bold mb-4">Control de Acceso (Vehículos Agendados)</h1>
      <p className="text-gray-600 mb-6">Lista de OTs creadas por un Admin que están pendientes de llegar al taller.</p>

      {/* Barra de Búsqueda por Patente */}
      <div className="mb-6">
        <label htmlFor="busqueda" className="block text-sm font-medium text-gray-700">Buscar Patente</label>
        <input
          type="text"
          id="busqueda"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Ej: AB-CD-12"
          className="mt-1 block w-full max-w-md px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
        />
      </div>

      {/* --- Tabla de OTs Agendadas --- */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción / Motivo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Agendamiento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center">Cargando OTs agendadas...</td></tr>
            ) : otsFiltradas.length > 0 ? (
              otsFiltradas.map(ot => (
                <tr key={ot.id}>
                  <td className="px-6 py-4 font-medium">{ot.patente}</td>
                  <td className="px-6 py-4">{ot.descripcionProblema}</td>
                  <td className="px-6 py-4">{new Date(ot.fechaCreacion._seconds * 1000).toLocaleString('es-CL')}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleRegistrarLlegada(ot.id)}
                      disabled={actualizandoId === ot.id} // Deshabilita mientras se procesa
                      className="bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {actualizandoId === ot.id ? 'Registrando...' : 'Registrar Llegada'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-6 py-4 text-center">
                {busqueda ? 'No se encontraron OTs con esa patente.' : 'No hay OTs pendientes de llegada.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}