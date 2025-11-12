// frontend/app/crear-ot/page.tsx
// (CÓDIGO ACTUALIZADO: Eliminado el selector de Mecánicos)

'use client'; 
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast'; 

// Ya no necesitamos el tipo Mecanico

function CrearOTForm() {
  // Estados del formulario (simplificados)
  const [patente, setPatente] = useState('');
  const [descripcionProblema, setDescripcionProblema] = useState('');
  
  // (Estados de mecánico eliminados)

  const [loading, setLoading] = useState(false);
  const router = useRouter(); 
  const { user, userProfile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams(); 

  // --- useEffect (Simplificado) ---
  useEffect(() => {
    // 1. Rellena el formulario (sin cambios)
    const patenteURL = searchParams.get('patente');
    const motivoURL = searchParams.get('motivo');
    if (patenteURL) setPatente(patenteURL);
    if (motivoURL) setDescripcionProblema(motivoURL);

    // 2. Lógica de protección (sin cambios)
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (!rolesPermitidos.includes(userProfile.rol)) {
          router.push('/');
        }
        // (Ya no necesitamos cargar mecánicos aquí)
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router, searchParams]);
  
  // (Función fetchMecanicos eliminada)
  
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  // --- ¡handleCrearOT ACTUALIZADO! ---
  const handleCrearOT = async (e: React.FormEvent) => {
    e.preventDefault(); 
    // Validación simplificada
    if (!patente || !descripcionProblema) {
      toast.error('Por favor, completa la patente y la descripción.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes-trabajo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patente,
          descripcionProblema,
          // (Ya no enviamos los datos del mecánico)
        }),
      });
      if (!response.ok) throw new Error('Falló la creación de la OT');
      
      toast.success('¡OT registrada! Pendiente de diagnóstico.'); 
      
      // Lo enviamos de vuelta a la bandeja de solicitudes,
      // que será nuestro próximo punto de trabajo.
      router.push('/solicitudes-pendientes'); 
      
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false); 
    }
  };

  // (handleMecanicoChange eliminado)

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Registrar Nueva Orden de Trabajo
        </h1>
        <form onSubmit={handleCrearOT} className="space-y-6">
          
          {/* Patente */}
          <div>
            <label htmlFor="patente" className="block text-sm font-medium text-gray-700">Patente</label>
            <input
              type="text" id="patente" value={patente}
              onChange={(e) => setPatente(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            />
          </div>
          
          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción / Motivo</label>
            <textarea
              id="descripcion" value={descripcionProblema}
              onChange={(e) => setDescripcionProblema(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            />
          </div>

          {/* --- (Selector de Mecánico ELIMINADO) --- */}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Guardando...' : 'Registrar OT (Pendiente Diagnóstico)'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- ENVOLTORIO (sin cambios) ---
export default function CrearOTPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <CrearOTForm />
    </Suspense>
  );
}