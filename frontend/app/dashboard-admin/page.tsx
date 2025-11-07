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
  // (¡Cambiado!) Inicia 'dataLoading' en 'false'. Lo activaremos solo si es necesario.
  const [dataLoading, setDataLoading] = useState(false); 
  const [error, setError] = useState('');

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // --- PASO 2: LÓGICA DE 'useEffect' CORREGIDA ---
  useEffect(() => {
    // Si el 'user' (del hook useAuth) existe...
    if (user) {
      const fetchUsuarios = async () => {
        try {
          setDataLoading(true); // Ahora sí, activa "Cargando..."
          setError('');
          
          const response = await fetch('/api/usuarios');
          
          if (!response.ok) {
            throw new Error('No se pudieron cargar los usuarios');
          }
          
          const data = await response.json();
          setUsuarios(data); 
          
        } catch (err) {
          if (err instanceof Error) setError(err.message);
          else setError('Un error desconocido ocurrió');
        } finally {
          setDataLoading(false); // Deja de cargar la tabla
        }
      };
      fetchUsuarios();
      
    } else if (!authLoading) { 
      // Si NO hay usuario (user es null) Y la autenticación YA TERMINÓ...
      // ¡Redirige!
      router.push('/');
    }
    
    // La lógica se activa si 'user' o 'authLoading' cambian
  }, [user, authLoading, router]);
  
  // --- FIN DE LA CORRECCIÓN ---


  // --- PASO 3: LÓGICA DE RETORNO TEMPRANO ---
  // Muestra "Validando..." SOLO si la autenticación está cargando
  // o si el usuario aún no existe (porque está a punto de ser redirigido)
  if (authLoading || !user) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }
  
  // --- Lógica de Eliminar (la pondremos aquí para que no de error) ---
  const handleEliminar = async (userId: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a "${nombre}"?`)) return;
    try {
      const response = await fetch(`/api/usuarios?id=${userId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      // Refresca la lista de usuarios
      setUsuarios(usuariosActuales => usuariosActuales.filter(user => user.id !== userId));
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Error desconocido al eliminar');
    }
  };

    // --- ¡AÑADE ESTA FUNCIÓN! ---
    const handleLogout = async () => {
      try {
        await signOut(auth); // Le dice a Firebase que cierre sesión
        // ¡No necesitas redirigir aquí!
        // El "Cerebro" (AuthContext) detectará el cambio,
        // 'user' se volverá 'null', y el 'useEffect'
        // que ya escribimos se encargará de redirigirnos al login.
      } catch (err) {
        console.error("Error al cerrar sesión:", err);
        setError("No se pudo cerrar la sesión.");
      }
    };
    // --- FIN DE LA FUNCIÓN ---

  // --- PASO 4: RENDERIZAR LA PÁGINA ---
  // Si llegamos aquí, es porque 'user' SÍ existe.
  return (
    <div className="p-8 text-gray-900">
      
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Administración de Usuarios</h1>
        <Link href="/dashboard-admin/crear-usuario"> 
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-blue-700">
            + Crear Nuevo Usuario
          </button>
        </Link>
          {/* --- ¡AÑADE ESTE BOTÓN! --- */}
          <button 
            onClick={handleLogout}
            className="bg-red-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-red-700 ml-4"
          >
            Cerrar Sesión
          </button>
          {/* --- FIN DEL BOTÓN --- */}
      </div>

      {/* (Filtros - Opcional) */}

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
                    <button className="text-blue-600 hover:text-blue-900">Editar</button>
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