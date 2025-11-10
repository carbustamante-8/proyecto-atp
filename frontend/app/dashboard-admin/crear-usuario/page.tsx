// frontend/app/dashboard-admin/crear-usuario/page.tsx
'use client'; 
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// --- COMPONENTE DEL FORMULARIO ---
function CrearUsuarioForm() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(''); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (!rolesPermitidos.includes(userProfile.rol)) {
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!nombre || !email || !password || !rol) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, rol }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falló la creación del usuario');
      }
      router.push('/dashboard-admin');
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Crear Nuevo Usuario
        </h1>
        <form onSubmit={handleCrearUsuario} className="space-y-6">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            />
          </div>
          <div>
            <label htmlFor="rol" className="block text-sm font-medium text-gray-700">Rol</label>
            <select id="rol" value={rol} onChange={(e) => setRol(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            >
              <option value="" disabled>Selecciona un rol</option>
              <option value="Jefe de Taller">Jefe de Taller</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Coordinador">Coordinador</option>
              <option value="Mecánico">Mecánico</option>
              <option value="Guardia">Guardia</option>
              <option value="Conductor">Conductor</option> 
              <option value="Vendedor">Vendedor</option> 
              <option value="Gerente">Gerente</option> 
            </select>
          </div>
          {error && (<p className="text-red-500 text-center">{error}</p>)}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- ENVOLTORIO (para arreglar el error de Vercel 'useSearchParams') ---
export default function CrearUsuarioPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <CrearUsuarioForm />
    </Suspense>
  );
}