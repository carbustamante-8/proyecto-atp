// frontend/app/control-acceso/page.tsx
'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast'; // <-- 1. Importar toast

export default function ControlAccesoPage() {
  const [patente, setPatente] = useState('');
  const [chofer, setChofer] = useState('');
  const [motivoIngreso, setMotivoIngreso] = useState('');
  const [numeroChasis, setNumeroChasis] = useState('');
  const [zonaOrigen, setZonaOrigen] = useState('');
  
  // const [error, setError] = useState(''); // <-- 2. Ya no lo usamos
  const [loading, setLoading] = useState(false);
  // const [success, setSuccess] = useState(false); // <-- 2. Ya no lo usamos
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // ... (lógica de protección no cambia) ...
    if (!authLoading) {
      if (user && userProfile) {
        if (userProfile.rol !== 'Guardia') {
          if (userProfile.rol === 'Mecánico') router.push('/mis-tareas');
          else if (userProfile.rol === 'Jefe de Taller') router.push('/dashboard-admin');
          else router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const handleRegistrarIngreso = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!patente || !chofer || !motivoIngreso || !numeroChasis || !zonaOrigen) {
      toast.error('Por favor, completa todos los campos.'); // <-- 3. Cambiado
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/registros-acceso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patente, chofer, motivoIngreso, numeroChasis, zonaOrigen,
        }),
      });
      if (!response.ok) throw new Error('Falló el registro del ingreso');
      
      toast.success('¡Ingreso registrado exitosamente!'); // <-- 3. Cambiado
      
      setPatente('');
      setChofer('');
      setMotivoIngreso('');
      setNumeroChasis('');
      setZonaOrigen('');
    } catch (err) {
      if (err instanceof Error) toast.error(err.message); // <-- 3. Cambiado
    } finally {
      setLoading(false); 
    }
  };

  if (authLoading || !userProfile || userProfile.rol !== 'Guardia') {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Control de Acceso Vehicular
        </h1>
        <p className="text-center text-gray-500 mb-6">Rol: Guardia de Seguridad</p>
        <form onSubmit={handleRegistrarIngreso} className="space-y-4">
          {/* ... (inputs de patente, chofer, chasis, zona, motivo) ... */}
          <div>
            <label htmlFor="patente" className="block text-sm font-medium text-gray-700">Patente</label>
            <input type="text" id="patente" value={patente} onChange={(e) => setPatente(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            />
          </div>
          <div>
            <label htmlFor="chofer" className="block text-sm font-medium text-gray-700">Nombre del Chofer</label>
            <input type="text" id="chofer" value={chofer} onChange={(e) => setChofer(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            />
          </div>
          <div>
            <label htmlFor="numeroChasis" className="block text-sm font-medium text-gray-700">
              Número de Chasis
            </label>
            <input
              type="text" id="numeroChasis" value={numeroChasis}
              onChange={(e) => setNumeroChasis(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            />
          </div>
          <div>
            <label htmlFor="zonaOrigen" className="block text-sm font-medium text-gray-700">Zona de Origen</label>
            <input type="text" id="zonaOrigen" value={zonaOrigen} onChange={(e) => setZonaOrigen(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            />
          </div>
          <div>
            <label htmlFor="motivoIngreso" className="block text-sm font-medium text-gray-700">Motivo de Ingreso</label>
            <textarea id="motivoIngreso" value={motivoIngreso} onChange={(e) => setMotivoIngreso(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            />
          </div>
          {/* Los mensajes de error/éxito ahora son Toasts */}
          <button
            type="submit"
            disabled={loading} 
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Registrando...' : 'Registrar Ingreso'}
          </button>
        </form>
      </div>
    </div>
  );
}