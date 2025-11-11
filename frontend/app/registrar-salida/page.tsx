// frontend/app/registrar-salida/page.tsx
// (CÓDIGO CORREGIDO: Arreglo visual del modal y tipo de datos)

'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; 

// --- ¡TIPO CORREGIDO! (Añadidos campos faltantes) ---
type RegistroIngreso = {
  id: string;
  patente: string;
  chofer: string;
  motivoIngreso: string;
  numeroChasis: string; // <-- AÑADIDO
  zonaOrigen: string;   // <-- AÑADIDO
  fechaIngreso: { _seconds: number };
};

export default function RegistrarSalidaPage() {
  
  const [registrosAbiertos, setRegistrosAbiertos] = useState<RegistroIngreso[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Estados para el Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [registroParaBorrar, setRegistroParaBorrar] = useState<{id: string, patente: string} | null>(null);

  // Lógica de Protección y Carga
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        if (userProfile.rol === 'Guardia') {
          fetchRegistrosAbiertos();
        } else {
          if (userProfile.rol === 'Mecánico') router.push('/mis-tareas');
          else if (userProfile.rol === 'Jefe de Taller') router.push('/dashboard-admin');
          else router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // Función de Carga de Datos
  const fetchRegistrosAbiertos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/registros-acceso');
      if (!response.ok) throw new Error('No se pudieron cargar los vehículos');
      const data = await response.json();
      setRegistrosAbiertos(data);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica del Modal ---
  const handleAbrirModal = (id: string, patente: string) => {
    setRegistroParaBorrar({ id, patente });
    setModalAbierto(true);
  };
  const handleCerrarModal = () => {
    setModalAbierto(false);
    setRegistroParaBorrar(null);
  };
  const handleConfirmarSalida = async () => {
    if (!registroParaBorrar) return;
    try {
      const response = await fetch('/api/control-salida', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: registroParaBorrar.id }), 
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falló el registro de la salida');
      }
      setRegistrosAbiertos(registrosActuales =>
        registrosActuales.filter(reg => reg.id !== registroParaBorrar.id)
      );
      toast.success(`¡Salida de ${registroParaBorrar.patente} registrada!`); 
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
      else toast.error('Un error desconocido ocurrió');
    } finally {
      handleCerrarModal();
    }
  };

  // --- Lógica de Retorno Temprano ---
  if (authLoading || !userProfile || userProfile.rol !== 'Guardia') {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  // --- JSX (CON EL MODAL ARREGLADO) ---
  return (
    <>
      {/* --- EL MODAL (ESTRUCTURA CORREGIDA) --- */}
      {modalAbierto && registroParaBorrar && (
        // Contenedor principal (fijo, z-50, centrado)
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          
          {/* 1. El OVERLAY (fondo negro semitransparente) */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50" 
            onClick={handleCerrarModal}
          ></div>
          
          {/* 2. El CONTENIDO (caja blanca) */}
          {/* 'relative' y 'z-10' lo ponen POR ENCIMA del overlay negro */}
          <div className="relative z-10 bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Salida</h2>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que quieres registrar la salida del vehículo patente 
              <strong className="text-blue-600"> {registroParaBorrar.patente}</strong>?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCerrarModal}
                className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarSalida}
                className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 font-medium"
              >
                Confirmar Salida
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- FIN DEL MODAL --- */}

      {/* --- PÁGINA PRINCIPAL --- */}
      <div className="p-8 text-gray-900">
        <h1 className="text-3xl font-bold mb-6">Registrar Salida de Vehículo</h1>
        <p className="text-gray-600 mb-6">Lista de vehículos actualmente DENTRO del taller.</p>
        
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chofer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo Ingreso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Ingreso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando vehículos...</td></tr>
              )}
              {!loading && registrosAbiertos.length > 0 ? (
                registrosAbiertos.map(reg => (
                  <tr key={reg.id}>
                    <td className="px-6 py-4 font-medium">{reg.patente}</td>
                    <td className="px-6 py-4">{reg.chofer}</td>
                    <td className="px-6 py-4">{reg.motivoIngreso}</td>
                    <td className="px-6 py-4">
                      {new Date(reg.fechaIngreso._seconds * 1000).toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button 
                        onClick={() => handleAbrirModal(reg.id, reg.patente)}
                        className="bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700"
                      >
                        Registrar Salida
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                !loading && registrosAbiertos.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-4 text-center">No hay vehículos dentro del taller.</td></tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}