// frontend/app/registrar-salida/page.tsx
'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; // <-- 1. Importar toast

type RegistroIngreso = {
  id: string;
  patente: string;
  chofer: string;
  motivoIngreso: string;
  fechaIngreso: { _seconds: number };
};

export default function RegistrarSalidaPage() {
  const [registrosAbiertos, setRegistrosAbiertos] = useState<RegistroIngreso[]>([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(''); // <-- 2. Ya no lo usamos
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        if (userProfile.rol === 'Guardia') {
          fetchRegistrosAbiertos();
        } else {
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchRegistrosAbiertos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/registros-acceso');
      if (!response.ok) throw new Error('No se pudieron cargar los vehículos');
      const data = await response.json();
      setRegistrosAbiertos(data);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message); // <-- 3. Cambiado
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarSalida = async (id: string, patente: string) => {
    if (!confirm(`¿Confirmar la SALIDA del vehículo patente ${patente}?`)) {
      return;
    }
    try {
      const response = await fetch('/api/control-salida', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id }), 
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falló el registro de la salida');
      }
      setRegistrosAbiertos(reg => reg.filter(r => r.id !== id));
      toast.success(`¡Salida de ${patente} registrada!`); // <-- 3. Cambiado
    } catch (err) {
      if (err instanceof Error) toast.error(err.message); // <-- 3. Cambiado
      else toast.error('Un error desconocido ocurrió'); // <-- 3. Cambiado
    }
  };

  if (authLoading || !userProfile || userProfile.rol !== 'Guardia') {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  return (
    <div className="p-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Registrar Salida de Vehículo</h1>
      <p className="text-gray-600 mb-6">Lista de vehículos actualmente DENTRO del taller.</p>
      
      {/* El error ahora es un Toast */}
      
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
                      onClick={() => handleRegistrarSalida(reg.id, reg.patente)}
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
  );
}