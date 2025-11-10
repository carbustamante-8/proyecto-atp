// app/dashboard-admin/page.tsx

'use client'; 

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; 
import { useRouter } from 'next/navigation';   
import { signOut } from 'firebase/auth'; 
import { auth } from '@/lib/firebase'; 

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
};

export default function DashboardAdminPage() {
  
  // --- PASO 1: LLAMAR A TODOS LOS HOOKS ARRIBA ---
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [dataLoading, setDataLoading] = useState(false); 
  const [error, setError] = useState('');

  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // --- PASO 2: LÓGICA DE 'useEffect' ---
  useEffect(() => {
    if (!authLoading && user) {
      if (userProfile) {
        
        // --- ¡EL GUARDIA! ---
        // (Ver las instrucciones del "BYPASS" más abajo)
        // 
        // const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        // 
        // if (rolesPermitidos.includes(userProfile.rol)) {
        //   // 1. ¡PERMITIDO! Carga los datos de la tabla
        fetchUsuarios(); // <-- ¡DEJA ESTA LÍNEA SIN COMENTAR!
        // } else {
        //   // 2. ¡NO PERMITIDO! Redirige según el rol
        //   console.warn(`Acceso denegado. Rol: ${userProfile.rol}`);
        //   if (userProfile.rol === 'Mecánico') {
        //     router.push('/mis-tareas'); 
        //   } else if (userProfile.rol === 'Guardia') {
        //     router.push('/control-acceso'); 
        //   } else {
        //     router.push('/'); 
        //   }
        // }
        // --- FIN DEL GUARDIA ---

      }
      
    } else if (!authLoading && !user) { 
      router.push('/'); 
    }
    
  }, [user, userProfile, authLoading, router]); 
  

  // Función para cargar los datos
  const fetchUsuarios = async () => {
    try {
      setDataLoading(true);
      setError('');
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('No se pudieron cargar los usuarios');
      const data = await response.json();
      setUsuarios(data); 
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Un error desconocido ocurrió');
    } finally {
      setDataLoading(false); 
    }
  };

  // --- Lógica de Acciones (Eliminar y Logout) ---
  const handleEliminar = async (userId: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a "${nombre}"?`)) return;
    try {
      const response = await fetch(`/api/usuarios?id=${userId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      setUsuarios(usuariosActuales => usuariosActuales.filter(user => user.id !== userId));
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  // --- PASO 3: LÓGICA DE RETORNO TEMPRANO ---
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  // --- PASO 4: RENDERIZAR LA PÁGINA ---
  return (
    <div className="p-8 text-gray-900">
      
      {/* Cabecera */}
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

      {/* Tabla de Usuarios (sin cambios) */}
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
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">Cargando usuarios...</td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-red-500">{error}</td>
              </tr>
            )}

            {!dataLoading && !error && usuarios.length > 0 ? (
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
              !dataLoading && !error && usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">No se encontraron usuarios.</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}