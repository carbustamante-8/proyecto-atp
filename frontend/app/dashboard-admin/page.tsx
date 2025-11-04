// app/dashboard-admin/page.tsx

'use client'; // <-- Obligatorio, porque vamos a pedir datos y usar botones

import { useState, useEffect } from 'react';
import Link from 'next/link'; // Para el botón de "Crear Nuevo Usuario"

// 1. Define un "tipo" para tus Usuarios (coincide con tu API y maqueta)
type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
};

export default function DashboardAdminPage() {
  
  // 2. Crea "estados" para guardar la lista de usuarios y el estado de carga
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 3. Este "Hook" se ejecuta 1 vez cuando la página carga
  useEffect(() => {
    
    // 4. Define la función para "ir a buscar" los datos a tu API
    const fetchUsuarios = async () => {
      try {
        setLoading(true);
        setError('');
        
        // ¡AQUÍ ESTÁ LA MAGIA! Llama a la API GET que creaste
        const response = await fetch('/api/usuarios');
        
        if (!response.ok) {
          throw new Error('No se pudieron cargar los usuarios');
        }
        
        const data = await response.json();
        setUsuarios(data); // Guarda la lista de usuarios en el estado
        
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('Un error desconocido ocurrió');
      } finally {
        setLoading(false); // Deja de cargar (ya sea con éxito o error)
      }
    };

    fetchUsuarios(); // Llama a la función al cargar la página
  }, []); // El array vacío `[]` significa "ejecutar solo 1 vez"


  // 5. MUESTRA LOS DATOS (Este JSX coincide con tu maqueta)
  return (
    <div className="p-8 text-gray-900"> {/* Contenedor principal */}
      
      {/* Cabecera: Título y Botón */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Administración de Usuarios</h1>
        
        {/* Este botón te llevará a la página para crear usuarios */}
        <Link href="/dashboard-admin/crear-usuario"> 
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-blue-700">
            + Crear Nuevo Usuario
          </button>
        </Link>
      </div>

      {/* Filtros (los dejamos como decoración por ahora) */}
      <div className="flex space-x-4 mb-4">
        <input 
          type="text" 
          placeholder="Buscar usuarios por nombre o email..." 
          className="px-4 py-2 border rounded-lg text-gray-900 w-1/3" 
        />
        <select className="px-4 py-2 border rounded-lg text-gray-900 bg-white">
          <option value="">Filtrar por Rol</option>
          <option value="Administrador">Administrador</option>
          <option value="Supervisor">Supervisor</option>
          <option value="Mecánico">Mecánico</option>
          <option value="Conductor">Conductor</option>
        </select>
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
            
            {/* Muestra "Cargando..." mientras busca los datos */}
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">Cargando usuarios...</td>
              </tr>
            )}

            {/* Muestra un error si falló la carga */}
            {error && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-red-500">{error}</td>
              </tr>
            )}

            {/* Muestra los datos cuando terminan de cargar */}
            {!loading && !error && usuarios.length > 0 ? (
              usuarios.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4">{user.nombre}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.rol}</td>
                  <td className="px-6 py-4">
                    {/* Lógica para mostrar la pastilla de estado Activo/Inactivo */}
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
                    <button className="text-red-600 hover:text-red-900 ml-4">Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              // Muestra esto si no está cargando pero no hay usuarios
              !loading && !error && usuarios.length === 0 && (
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