// frontend/app/dashboard-jefe-taller/page.tsx
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
  kilometraje: number;
  zonaOrigen: string;
  fechaIngreso: { _seconds: number };
};

export default function DashboardJefeTallerPage() {
  const [registros, setRegistros] = useState<RegistroIngreso[]>([]);
  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(''); // <-- 2. Ya no lo usamos
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // ... (lógica de protección no cambia) ...
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchRegistros();
        } else {
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchRegistros = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/registros-acceso');
      if (!response.ok) throw new Error('No se pudieron cargar los registros de ingreso');
      const data = await response.json();
      setRegistros(data); 
    } catch (err) {
      if (err instanceof Error) toast.error(err.message); // <-- 3. Cambiado
    } finally {
      setLoading(false); 
    }
  };

  const handleCrearOT = (registro: RegistroIngreso) => {
    toast.success('Redirigiendo para crear OT...'); // <-- 3. Cambiado
    const patente = encodeURIComponent(registro.patente);
    const motivo = encodeURIComponent(registro.motivoIngreso);
    router.push(`/crear-ot?patente=${patente}&motivo=${motivo}`);
  };

  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  if (!['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol)) {
     return <div className="p-8 text-gray-900">Acceso denegado.</div>;
  }

  return (
    <div className="p-8 text-gray-900"> 
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard Jefe de Taller</h1>
        <p className="text-gray-600">Vehículos pendientes de asignación</p>
      </div>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          {/* ... (thead no cambia) ... */}
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chofer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo Ingreso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kilometraje</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Ingreso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr><td colSpan={6} className="px-6 py-4 text-center">Cargando ingresos...</td></tr>
            )}
            {/* El error ahora es un Toast */}
            {!loading && registros.length > 0 ? (
              registros.map(reg => (
                <tr key={reg.id}>
                  <td className="px-6 py-4 font-medium">{reg.patente}</td>
                  <td className="px-6 py-4">{reg.chofer}</td>
                  <td className="px-6 py-4">{reg.motivoIngreso}</td>
                  <td className="px-6 py-4">{reg.kilometraje}</td>
                  <td className="px-6 py-4">
                    {new Date(reg.fechaIngreso._seconds * 1000).toLocaleString('es-CL')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button 
                      onClick={() => handleCrearOT(reg)}
                      className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
                    >
                      Crear OT
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              !loading && registros.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-4 text-center">No hay vehículos pendientes de ingreso.</td></tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}