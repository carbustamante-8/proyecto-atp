// frontend/app/control-acceso/page.tsx
'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 


export default function ControlAccesoPage() {
  const [patente, setPatente] = useState('');
  const [chofer, setChofer] = useState('');
  const [motivoIngreso, setMotivoIngreso] = useState('');
  const [kilometraje, setKilometraje] = useState('');
  const [zonaOrigen, setZonaOrigen] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); 
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        if (userProfile.rol !== 'Guardia') {
          console.warn(`Acceso denegado a /control-acceso. Rol: ${userProfile.rol}`);
          if (userProfile.rol === 'Mecánico') router.push('/mis-tareas');
          else if (userProfile.rol === 'Jefe de Taller') router.push('/dashboard-admin');
          else router.push('/');
        }
        // Si ES Guardia, no hace nada, permite ver la página
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const handleRegistrarIngreso = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!patente || !chofer || !motivoIngreso || !kilometraje || !zonaOrigen) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const response = await fetch('/api/registros-acceso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patente, chofer, motivoIngreso, kilometraje, zonaOrigen,
        }),
      });
      if (!response.ok) throw new Error('Falló el registro del ingreso');
      setSuccess(true); 
      setPatente('');
      setChofer('');
      setMotivoIngreso('');
      setKilometraje('');
      setZonaOrigen('');
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false); 
    }
  };

  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  // Si llegamos aquí, SÍ es un Guardia (o la lógica aún no se ha ejecutado)
  // Añadimos una comprobación final por si acaso
  if (userProfile.rol !== 'Guardia') {
    return <div className="p-8 text-gray-900">Acceso denegado.</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Control de Acceso Vehicular
        </h1>
        <p className="text-center text-gray-500 mb-6">Rol: Guardia de Seguridad</p>
        <form onSubmit={handleRegistrarIngreso} className="space-y-4">
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
            <label htmlFor="kilometraje" className="block text-sm font-medium text-gray-700">Kilometraje</label>
            <input type="number" id="kilometraje" value={kilometraje} onChange={(e) => setKilometraje(e.target.value)}
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
          {error && (<p className="text-red-500 text-center">{error}</p>)}
          {success && (<p className="text-green-500 text-center">¡Ingreso registrado exitosamente!</p>)}
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