// frontend/app/registrar-salida/page.tsx
// (¡CÓDIGO COMPLETAMENTE NUEVO!)

'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';


// Tipo para los registros que vienen de la API
type RegistroIngreso = {
  id: string;
  patente: string;
  chofer: string;
  motivoIngreso: string;
  fechaIngreso: {
    _seconds: number;
  };
};

export default function RegistrarSalidaPage() {
  
  // --- HOOKS ---
  const [registrosAbiertos, setRegistrosAbiertos] = useState<RegistroIngreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- LÓGICA DE PROTECCIÓN Y CARGA ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        if (userProfile.rol === 'Guardia') {
          // ¡PERMITIDO! Carga los datos
          fetchRegistrosAbiertos();
        } else {
          // ¡NO PERMITIDO! Redirige
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // Función para cargar los vehículos que ESTÁN DENTRO
  const fetchRegistrosAbiertos = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Llama a la API que acabamos de arreglar
      const response = await fetch('/api/registros-acceso');
      if (!response.ok) throw new Error('No se pudieron cargar los vehículos');
      const data = await response.json();
      setRegistrosAbiertos(data);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para el botón "Registrar Salida" de la tabla
  const handleRegistrarSalida = async (id: string, patente: string) => {
    if (!confirm(`¿Confirmar la SALIDA del vehículo patente ${patente}?`)) {
      return;
    }

    try {
      // 2. Llama a la API (corregida) pasando el ID
      const response = await fetch('/api/control-salida', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id }), // Envía el ID único
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falló el registro de la salida');
      }

      // 3. ¡Éxito! Refresca la lista (quitando el que acaba de salir)
      setRegistrosAbiertos(registrosActuales =>
        registrosActuales.filter(reg => reg.id !== id)
      );
      alert(`¡Salida de ${patente} registrada!`);

    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Un error desconocido ocurrió');
    }
  };

  // --- LÓGICA DE RETORNO TEMPRANO ---
  if (authLoading || !userProfile || userProfile.rol !== 'Guardia') {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  // --- JSX (Ahora es una tabla) ---
  return (
    <div className="p-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Registrar Salida de Vehículo</h1>
      <p className="text-gray-600 mb-6">Lista de vehículos actualmente DENTRO del taller.</p>
      
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      
      {/* Tabla de Vehículos Dentro */}
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

            {!loading && !error && registrosAbiertos.length > 0 ? (
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
                      onClick={() => handleRegistrarSalida(reg.id, reg.patente)}
                      className="bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700"
                    >
                      Registrar Salida
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              !loading && !error && registrosAbiertos.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-4 text-center">No hay vehículos dentro del taller.</td></tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}