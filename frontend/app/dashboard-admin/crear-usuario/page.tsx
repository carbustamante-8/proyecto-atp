// frontend/app/dashboard-admin/crear-usuario/page.tsx
// (CÓDIGO ACTUALIZADO: Añadido botón "Cancelar")

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function CrearUsuarioPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [rol, setRol] = useState('Mecánico'); 
  const [estado, setEstado] = useState('Activo'); 
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (!rolesPermitidos.includes(userProfile.rol)) {
          toast.error('No tienes permiso para acceder a esta página.');
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    toast.loading('Creando usuario...');

    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, nombre, rut, rol, estado }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el usuario');
      }

      toast.dismiss();
      toast.success('¡Usuario creado exitosamente!');
      router.push('/dashboard-admin');
    } catch (error) {
      toast.dismiss();
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Ocurrió un error inesperado');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }
  if (!userProfile || !['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol)) {
    return <div className="p-8 text-gray-900">Acceso denegado.</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Crear Nuevo Usuario
        </h1>
        <form onSubmit={handleCrearUsuario} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
          </div>
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
            <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
          </div>
          <div>
            <label htmlFor="rut" className="block text-sm font-medium text-gray-700">RUT</label>
            <input type="text" id="rut" value={rut} onChange={(e) => setRut(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
          </div>
          <div>
            <label htmlFor="rol" className="block text-sm font-medium text-gray-700">Rol</label>
            <select id="rol" value={rol} onChange={(e) => setRol(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50">
              <option value="Jefe de Taller">Jefe de Taller</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Coordinador">Coordinador</option>
              <option value="Mecánico">Mecánico</option>
              <option value="Guardia">Guardia</option>
              <option value="Conductor">Conductor</option>
              <option value="Gerente">Gerente</option>
            </select>
          </div>
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
            <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50">
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          {/* --- ¡BLOQUE DE BOTONES ACTUALIZADO! --- */}
          <div className="space-y-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
            
            {/* --- ¡NUEVO BOTÓN DE CANCELAR! --- */}
            <button
              type="button"
              onClick={() => router.push('/dashboard-admin')} // Vuelve a la lista
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
          {/* --- FIN DEL BLOQUE --- */}

        </form>
      </div>
    </div>
  );
}