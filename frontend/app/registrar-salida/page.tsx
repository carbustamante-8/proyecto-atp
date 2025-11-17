'use client';
import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

// (El tipo de dato no cambia)
type OT = {
  id: string;
  patente: string;
  nombre_conductor: string;
  mecanicoAsignadoNombre?: string;
  estado: string;
};

// --- ¡NUEVO! Estilo estándar para inputs (v3) ---
const inputStyle = "w-full px-4 py-3 border border-gray-300 rounded-md text-neutral-900 bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-pepsi-blue-light focus:border-transparent transition-shadow duration-200";

export default function RegistrarSalidaPage() {
  
  // (Toda la lógica de 'useState', 'useEffect' y 'fetch' queda idéntica)
  const [otsCerradas, setOtsCerradas] = useState<OT[]>([]);
  const [filtroPatente, setFiltroPatente] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [otSeleccionada, setOtSeleccionada] = useState<OT | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        if (userProfile.rol === 'Guardia') {
          fetchOTsCerradas();
        } else {
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchOTsCerradas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo');
      if (!response.ok) throw new Error('No se pudo cargar la lista de OTs');
      const data: OT[] = await response.json();
      const cerradas = data.filter(ot => ot.estado === 'Cerrado');
      setOtsCerradas(cerradas);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirModal = (ot: OT) => {
    setOtSeleccionada(ot);
    setModalAbierto(true);
  };

  const handleCerrarModal = () => {
    setOtSeleccionada(null);
    setModalAbierto(false);
  };

  const handleConfirmarSalida = async () => {
    if (!otSeleccionada) return;
    setIsUpdating(true);
    const promise = fetch(`/api/ordenes-trabajo/${otSeleccionada.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        estado: 'Completado', // Estado final del ciclo de vida
        accion: 'registrarSalida',
      }),
    });

    toast.promise(promise, {
      loading: 'Registrando salida...',
      success: (res) => {
        if (!res.ok) throw new Error('Error al registrar la salida');
        setIsUpdating(false);
        handleCerrarModal();
        fetchOTsCerradas(); // Recargar la lista
        return '¡Salida registrada exitosamente!';
      },
      error: (err) => {
        setIsUpdating(false);
        return err.message || 'Error al registrar la salida';
      }
    });
  };

  const otsFiltradas = otsCerradas.filter(ot => 
    ot.patente.toLowerCase().includes(filtroPatente.toLowerCase())
  );

  if (authLoading || loading) {
    return <div className="p-8 font-sans">Validando sesión y cargando vehículos...</div>;
  }

  // --- JSX REFACTORIZADO VISUALMENTE ---
  return (
    <Fragment>
      {/* --- Modal de Confirmación (Rediseñado) --- */}
      {/* Usamos las clases globales .modal-overlay y .modal-content */}
      {modalAbierto && otSeleccionada && (
        <div className="modal-overlay" onClick={handleCerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Confirmar Salida</h2>
            <p className="text-neutral-700 mb-6">
              ¿Confirmas la salida del vehículo patente <strong className="text-pepsi-blue">{otSeleccionada.patente}</strong>? 
              El trabajo fue finalizado por <strong className="text-pepsi-blue">{otSeleccionada.mecanicoAsignadoNombre || 'Taller'}</strong>.
            </p>
            <div className="flex justify-end space-x-4">
              {/* Botón Cancelar (neutral) */}
              <button 
                onClick={handleCerrarModal} 
                disabled={isUpdating}
                className="px-4 py-2 rounded-md text-neutral-900 bg-neutral-100 hover:bg-neutral-200 font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              {/* Botón Confirmar (Pepsi) */}
              <button 
                onClick={handleConfirmarSalida} 
                disabled={isUpdating}
                className="px-4 py-2 rounded-md text-white bg-pepsi-blue hover:bg-pepsi-blue-dark font-medium transition-colors duration-200 disabled:bg-gray-400"
              >
                {isUpdating ? 'Registrando...' : 'Confirmar Salida'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Contenedor Principal de la Página --- */}
      <div className="p-8 font-sans">
        
        {/* Título con color Pepsi */}
        <h1 className="text-3xl font-bold text-pepsi-blue mb-6">Registro de Salida (Guardia)</h1>

        {/* --- Tarjeta de Filtro --- */}
        <div className="bg-white shadow-card rounded-lg p-4 mb-6 max-w-md">
          <label htmlFor="filtroPatente" className="block text-sm font-medium text-neutral-700 mb-1">
            Buscar por Patente
          </label>
          <input
            type="text"
            id="filtroPatente"
            value={filtroPatente}
            onChange={(e) => setFiltroPatente(e.target.value)}
            placeholder="Ej: ABCD12..."
            className={inputStyle} // Estilo estándar v3
          />
        </div>

        {/* --- Tarjeta de la Tabla --- */}
        <div className="bg-white shadow-card rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Header de la tabla (neutral) */}
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Conductor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Mecánico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {otsFiltradas.length > 0 ? (
                otsFiltradas.map(ot => (
                  <tr key={ot.id}>
                    <td className="px-6 py-4 font-medium text-neutral-900">{ot.patente}</td>
                    <td className="px-6 py-4 text-neutral-700">{ot.nombre_conductor}</td>
                    <td className="px-6 py-4 text-neutral-700">{ot.mecanicoAsignadoNombre || 'Taller'}</td>
                    <td className="px-6 py-4">
                      {/* Pastilla de estado (neutral) */}
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-neutral-100 text-neutral-900">
                        {ot.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {/* Botón de acción con estilo Pepsi */}
                      <button 
                        onClick={() => handleAbrirModal(ot)}
                        className="bg-pepsi-blue text-white px-4 py-2 rounded-md shadow font-medium hover:bg-pepsi-blue-dark transition-colors duration-200"
                      >
                        Registrar Salida
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-neutral-700">
                    No hay vehículos listos para salir.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Fragment>
  );
}