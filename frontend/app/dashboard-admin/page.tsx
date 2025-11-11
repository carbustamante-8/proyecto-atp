// frontend/app/dashboard-admin/page.tsx
'use client'; 
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
};

export default function DashboardAdminPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- LÓGICA DE PROTECCIÓN Y CARGA ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador', 'Gerente'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchUsuarios();
        } else {
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('No se pudieron cargar los usuarios');
      const data = await response.json();
      setUsuarios(data);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (userId: string, nombre: string) => {
    if (!confirm(`¿Seguro que quieres eliminar al usuario "${nombre}"?`)) return;
    try {
      const response = await fetch(`/api/usuarios?id=${userId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar el usuario');
      setUsuarios(u => u.filter(usuario => usuario.id !== userId));
      toast.success(`Usuario "${nombre}" eliminado.`);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  // --- LÓGICA DE RETORNO TEMPRANO ---
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }

  if (!['Jefe de Taller', 'Supervisor', 'Coordinador', 'Gerente'].includes(userProfile.rol)) {
    return <div className="p-8 text-gray-900">Acceso denegado.</div>;
  }

  // --- RENDERIZADO DE LA PÁGINA ---
  return (
    <div className="p-8 text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <Link href="/dashboard-admin/crear-usuario">
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-blue-700">
            + Crear Nuevo Usuario
          </button>
        </Link>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  Cargando usuarios...
                </td>
              </tr>
            )}
            {!loading && usuarios.length > 0 ? (
              usuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td className="px-6 py-4 font-medium">{usuario.nombre}</td>
                  <td className="px-6 py-4">{usuario.email}</td>
                  <td className="px-6 py-4">{usuario.rol}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        usuario.estado === 'Activo'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {usuario.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <Link href={`/dashboard-admin/editar-usuario/${usuario.id}`}>
                      <button className="text-blue-600 hover:text-blue-900">
                        Editar
                      </button>
                    </Link>
                    <button
                      onClick={() => handleEliminar(usuario.id, usuario.nombre)}
                      className="text-red-600 hover:text-red-900 ml-4"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              !loading && usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}