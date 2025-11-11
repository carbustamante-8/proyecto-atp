// frontend/app/dashboard-admin/page.tsx
// (CÓDIGO ACTUALIZADO: "Gerente" eliminado de la seguridad)

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
  
  // --- HOOKS ---
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [dataLoading, setDataLoading] = useState(false); 
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // --- ESTADOS PARA EL MODAL DE ELIMINAR ---
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioParaBorrar, setUsuarioParaBorrar] = useState<{id: string, nombre: string} | null>(null);

  // --- LÓGICA DE PROTECCIÓN Y CARGA ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        
        // --- ¡LISTA DE SEGURIDAD CORREGIDA! ---
        // (Roles que SÍ pueden ver esta página)
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        // --- FIN DE LA CORRECCIÓN ---

        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchUsuarios(); // ¡Permitido! Carga los datos
        } else {
          // ¡No permitido! Redirige
          if (userProfile.rol === 'Mecánico') router.push('/mis-tareas');
          else if (userProfile.rol === 'Guardia') router.push('/control-acceso');
          else router.push('/');
        }
      } else if (!user) {
        router.push('/'); // Si no hay usuario, al login
      }
    }
  }, [user, userProfile, authLoading, router]);
  
  // --- (Función 'fetchUsuarios' - Sin cambios) ---
  const fetchUsuarios = async () => {
    setDataLoading(true);
    try {
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('No se pudieron cargar los usuarios');
      const data = await response.json();
      setUsuarios(data); 
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setDataLoading(false); 
    }
  };

  // --- (Lógica del Modal - Sin cambios) ---
  const handleAbrirModalEliminar = (id: string, nombre: string) => {
    setUsuarioParaBorrar({ id, nombre });
    setModalAbierto(true);
  };
  const handleCerrarModalEliminar = () => {
    setModalAbierto(false);
    setUsuarioParaBorrar(null);
  };
  const handleConfirmarEliminar = async () => {
    if (!usuarioParaBorrar) return;
    try {
      const response = await fetch(`/api/usuarios?id=${usuarioParaBorrar.id}`, { method: 'DELETE' });
      if (!response.ok) {
         const data = await response.json();
         throw new Error(data.error || 'Error al eliminar');
      }
      setUsuarios(usuariosActuales => 
        usuariosActuales.filter(user => user.id !== usuarioParaBorrar.id)
      );
      toast.success(`Usuario "${usuarioParaBorrar.nombre}" eliminado.`);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      handleCerrarModalEliminar();
    }
  };

  // --- LÓGICA DE RETORNO TEMPRANO ---
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  // (Guardia final por si acaso)
  if (!['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol)) {
     return <div className="p-8 text-gray-900">Acceso denegado.</div>;
  }

  // --- RENDERIZADO DE LA PÁGINA ---
  return (
    <>
      {/* --- MODAL DE CONFIRMACIÓN DE ELIMINAR --- */}
      {modalAbierto && usuarioParaBorrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
            onClick={handleCerrarModalEliminar}
          ></div>
          <div className="relative z-10 bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que quieres eliminar al usuario 
              <strong className="text-red-600"> {usuarioParaBorrar.nombre}</strong>?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCerrarModalEliminar}
                className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEliminar}
                className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 font-medium"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- FIN DEL MODAL --- */}
      
      <div className="p-8 text-gray-900">
        
        {/* Cabecera (Limpia) */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Administración de Usuarios</h1>
          <div>
            <Link href="/dashboard-admin/crear-usuario"> 
              <button className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-blue-700">
                + Crear Nuevo Usuario
              </button>
            </Link>
          </div>
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
              {dataLoading && (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando usuarios...</td></tr>
              )}
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
                      <button onClick={() => handleAbrirModalEliminar(user.id, user.nombre)} className="text-red-600 hover:text-red-900 ml-4">Eliminar</button>
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
    </>
  );
}