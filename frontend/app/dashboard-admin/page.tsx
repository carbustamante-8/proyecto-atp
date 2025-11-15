// frontend/app/dashboard-admin/page.tsx
'use client'; 
import { useState, useEffect } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

type User = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
};

export default function DashboardAdminPage() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioParaEliminar, setUsuarioParaEliminar] = useState<User | null>(null);
  
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  // frontend/app/dashboard-admin/page.tsx

  // ... (antes del useEffect)

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        // Roles que SÍ pueden ver esta página
        const rolesPermitidos = ['Supervisor', 'Coordinador'];
        
        if (rolesPermitidos.includes(userProfile.rol)) {
          // ¡OK! Carga los datos
          fetchUsuarios();
        } else {
          // ¡BLOQUEADO! Redirige al home de ESE rol, no a /
          toast.error('Acceso denegado');
          if (userProfile.rol === 'Jefe de Taller') {
            router.push('/agenda-taller');
          } else if (userProfile.rol === 'Mecánico') {
            router.push('/mis-tareas');
          } else if (userProfile.rol === 'Guardia') {
            router.push('/control-acceso');
          } else if (userProfile.rol === 'Conductor') {
            router.push('/portal-conductor');
          } else if (userProfile.rol === 'Gerente') {
            router.push('/generador-reportes');
          } else {
            router.push('/');
          }
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // ... (resto del archivo)

  // (fetchUsuarios - sin cambios)
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('No se pudo cargar la lista de usuarios');
      const data = await response.json();
      setUsuarios(data);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // (Funciones de Modal y Eliminar - sin cambios)
  const handleAbrirModal = (usuario: User) => {
    setUsuarioParaEliminar(usuario);
    setModalAbierto(true);
  };
  const handleCerrarModal = () => {
    setUsuarioParaEliminar(null);
    setModalAbierto(false);
  };
  const handleConfirmarEliminar = async () => {
    if (!usuarioParaEliminar) return;
    const toastId = toast.loading('Eliminando usuario...');
    try {
      const response = await fetch(`/api/usuarios/${usuarioParaEliminar.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el usuario');
      }
      toast.success('Usuario eliminado permanentemente.', { id: toastId });
      setUsuarios(usuarios.filter(u => u.id !== usuarioParaEliminar.id));
    } catch (err) {
      if (err instanceof Error) toast.error(err.message, { id: toastId });
    } finally {
      handleCerrarModal();
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-gray-900">Validando sesión y cargando usuarios...</div>;
  }
  
  // (Renderizado JSX - sin cambios)
  return (
    <>
      {modalAbierto && usuarioParaEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleCerrarModal}></div>
          <div className="relative z-10 bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que quieres eliminar al usuario 
              <strong className="text-blue-600"> {usuarioParaEliminar.nombre}</strong> ({usuarioParaEliminar.email})? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-4">
              <button onClick={handleCerrarModal} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium">
                Cancelar
              </button>
              <button onClick={handleConfirmarEliminar} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 font-medium">
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8 text-gray-900">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <Link href="/dashboard-admin/crear-usuario">
            <span className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-blue-700">
              + Crear Usuario
            </span>
          </Link>
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
              {usuarios.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.rol}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link href={`/dashboard-admin/editar-usuario/${user.id}`}>
                      <span className="text-blue-600 hover:text-blue-900 cursor-pointer">Editar</span>
                    </Link>
                    <button onClick={() => handleAbrirModal(user)} className="text-red-600 hover:text-red-900">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}