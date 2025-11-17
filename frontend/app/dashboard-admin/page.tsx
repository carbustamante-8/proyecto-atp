'use client';
import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

// --- ¡NUEVO! Iconos para la UI ---
import { 
  UserPlusIcon, 
  PencilSquareIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';

// (El tipo Usuario no cambia)
type Usuario = {
  id: string;
  email: string;
  rol: string;
  nombre: string;
  apellido: string;
  rut: string;
  telefono: string;
};

export default function DashboardAdmin() {
  
  // (Toda la lógica de 'useState', 'useEffect' y 'fetch' queda idéntica)
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioParaEliminar, setUsuarioParaEliminar] = useState<Usuario | null>(null);

  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchUsuarios();
        } else {
          toast.error('Acceso denegado');
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
      if (!response.ok) throw new Error('No se pudo cargar la lista de usuarios');
      const data = await response.json();
      setUsuarios(data);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirModal = (usuario: Usuario) => {
    setUsuarioParaEliminar(usuario);
    setModalAbierto(true);
  };
  const handleCerrarModal = () => {
    setUsuarioParaEliminar(null);
    setModalAbierto(false);
  };

  const handleConfirmarEliminar = async () => {
    if (!usuarioParaEliminar) return;
    const idUsuario = usuarioParaEliminar.id;
    setModalAbierto(false);
    const promise = fetch(`/api/usuarios/${idUsuario}`, { method: 'DELETE' });
    toast.promise(promise, {
      loading: 'Eliminando usuario...',
      success: (res) => {
        if (!res.ok) throw new Error('Error de servidor al eliminar');
        setUsuarios(usuarios.filter(u => u.id !== idUsuario));
        setUsuarioParaEliminar(null);
        return 'Usuario eliminado permanentemente.';
      },
      error: (err) => {
        setUsuarioParaEliminar(null);
        return err.message || 'Error al eliminar el usuario';
      }
    });
  };
  
  if (authLoading || loading) {
    return <div className="p-8 font-sans">Validando sesión y cargando usuarios...</div>;
  }

  // --- JSX REFACTORIZADO VISUALMENTE ---
  return (
    <Fragment>
      {/* --- Modal de Confirmación (Rediseñado) --- */}
      {/* Usamos las clases globales .modal-overlay y .modal-content */}
      {modalAbierto && usuarioParaEliminar && (
        <div className="modal-overlay" onClick={handleCerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Confirmar Eliminación</h2>
            <p className="text-neutral-700 mb-6">
              ¿Estás seguro de que quieres eliminar al usuario 
              {/* Color de acento de la marca */}
              <strong className="text-pepsi-blue"> {usuarioParaEliminar.nombre} {usuarioParaEliminar.apellido}</strong> ({usuarioParaEliminar.email})?
            </p>
            <div className="flex justify-end space-x-4">
              {/* Botón Cancelar (neutral) */}
              <button 
                onClick={handleCerrarModal} 
                className="px-4 py-2 rounded-md text-neutral-900 bg-neutral-100 hover:bg-neutral-200 font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              {/* Botón de peligro usa el color pepsi-red */}
              <button 
                onClick={handleConfirmarEliminar} 
                className="px-4 py-2 rounded-md text-white bg-pepsi-red hover:bg-pepsi-red-dark font-medium transition-colors duration-200"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Contenedor Principal de la Página --- */}
      <div className="p-8 font-sans">
        
        {/* Encabezado con Título y Botón de Acción */}
        <div className="flex justify-between items-center mb-6">
          {/* Título usa el color pepsi-blue */}
          <h1 className="text-3xl font-bold text-pepsi-blue">Gestión de Usuarios</h1>
          
          {/* Botón principal usa el color pepsi-blue */}
          <Link 
            href="/dashboard-admin/crear-usuario"
            className="inline-flex items-center gap-2 bg-pepsi-blue text-white px-5 py-2 rounded-lg shadow font-semibold 
                       hover:bg-pepsi-blue-dark transition-colors duration-200"
          >
            <UserPlusIcon className="h-5 w-5" />
            Registrar Usuario
          </Link>
        </div>
        
        {/* Tarjeta blanca para la tabla */}
        <div className="bg-white shadow-card rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Header de la tabla (neutral) */}
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Nombre Completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">RUT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-neutral-900">{u.nombre} {u.apellido}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-700">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-neutral-700">{u.rut}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* (La lógica de estilos para el Rol no cambia) */}
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      u.rol === 'Supervisor' ? 'bg-red-100 text-red-800' :
                      u.rol === 'Jefe de Taller' ? 'bg-yellow-100 text-yellow-800' :
                      u.rol === 'Coordinador' ? 'bg-blue-100 text-pepsi-blue-light' :
                      u.rol === 'Mecánico' ? 'bg-neutral-100 text-neutral-900' :
                      u.rol === 'Guardia' ? 'bg-indigo-100 text-indigo-800' :
                      u.rol === 'Conductor' ? 'bg-green-100 text-green-800' :
                      'bg-pink-100 text-pink-800' // Gerente
                    }`}>
                      {u.rol}
                    </span>
                  </td>
                  
                  {/* Acciones de la tabla con iconos y colores de la marca */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <Link 
                      href={`/dashboard-admin/editar-usuario/${u.id}`}
                      className="inline-flex items-center gap-1 text-pepsi-blue-light hover:text-pepsi-blue-dark font-medium transition-colors duration-200"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Editar
                    </Link>
                    <button 
                      onClick={() => handleAbrirModal(u)} 
                      className="inline-flex items-center gap-1 text-pepsi-red hover:text-pepsi-red-dark font-medium transition-colors duration-200"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Fragment>
  );
}