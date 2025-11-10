// frontend/app/dashboard-admin/page.tsx
'use client'; 
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast'; // <-- 1. Importar toast

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
};

export default function DashboardAdminPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [dataLoading, setDataLoading] = useState(false); 
  // const [error, setError] = useState(''); // <-- 2. Ya no lo usamos
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchUsuarios();
        } else {
          if (userProfile.rol === 'Mecánico') router.push('/mis-tareas');
          else if (userProfile.rol === 'Guardia') router.push('/control-acceso');
          else router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);
  
  const fetchUsuarios = async () => {
    setDataLoading(true);
    try {
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('No se pudieron cargar los usuarios');
      const data = await response.json();
      setUsuarios(data); 
    } catch (err) {
      if (err instanceof Error) toast.error(err.message); // <-- 3. Cambiado
    } finally {
      setDataLoading(false); 
    }
  };

  const handleEliminar = async (userId: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a "${nombre}"?`)) return;
    try {
      const response = await fetch(`/api/usuarios?id=${userId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      setUsuarios(us => us.filter(user => user.id !== userId));
      toast.success(`Usuario "${nombre}" eliminado.`); // <-- 3. Cambiado
    } catch (err) {
      if (err instanceof Error) toast.error(err.message); // <-- 3. Cambiado
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      toast.error('Error al cerrar sesión.'); // <-- 3. Cambiado
    }
  };

  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  return (
    <div className="p-8 text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Administración de Usuarios</h1>
        <span className="text-lg">Rol: <strong className="text-blue-600">{userProfile.rol}</strong></span>
        <div>
          <Link href="/dashboard-admin/crear-usuario"> 
            <button className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-blue-700">
              + Crear Nuevo Usuario
            </button>
          </Link>
          <button 
            onClick={handleLogout}
            className="bg-red-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-red-700 ml-4"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
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
            {dataLoading && (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando usuarios...</td></tr>
            )}
            {/* El error ahora es un Toast, ya no se muestra en la tabla */}
            {!dataLoading && usuarios.length > 0 ? (
              usuarios.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4">{user.nombre}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.rol}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.estado === 'Activo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <Link href={`/dashboard-admin/editar-usuario/${user.id}`}>
                      <button className="text-blue-600 hover:text-blue-900">Editar</button>
                    </Link>
                    <button onClick={() => handleEliminar(user.id, user.nombre)} className="text-red-600 hover:text-red-900 ml-4">Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              !dataLoading && usuarios.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-4 text-center">No se encontraron usuarios.</td></tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}