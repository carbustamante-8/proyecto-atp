// app/dashboard-admin/editar-usuario/[id]/page.tsx

'use client'; // <-- Obligatorio, es un formulario interactivo

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Hooks para leer la URL y redirigir

// Define el tipo de datos del usuario
type UsuarioData = {
  nombre: string;
  email: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
};

export default function EditarUsuarioPage() {
  
  // 1. Hooks para leer el ID de la URL y para redirigir
  const params = useParams();
  const id = params.id as string; // 'id' viene del nombre de la carpeta [id]
  const router = useRouter();

  // 2. Estados para el formulario y la carga
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(''); // El email lo mostraremos, pero no lo dejaremos editar
  const [rol, setRol] = useState('');
  const [estado, setEstado] = useState<'Activo' | 'Inactivo'>('Activo');
  
  const [loading, setLoading] = useState(true); // Para el "Cargando..." inicial
  const [isUpdating, setIsUpdating] = useState(false); // Para el botón de "Guardar"
  const [error, setError] = useState('');

  // 3. Hook para BUSCAR los datos del usuario cuando la página carga
  useEffect(() => {
    if (id) {
      const fetchUsuario = async () => {
        try {
          setLoading(true);
          
          // ¡MAGIA 1! Llama a tu API GET por ID
          const response = await fetch(`/api/usuarios/${id}`);
          
          if (!response.ok) {
            throw new Error('No se pudo cargar este usuario');
          }
          
          const data: UsuarioData = await response.json();
          
          // 4. Rellena el formulario con los datos de la BD
          setNombre(data.nombre);
          setEmail(data.email);
          setRol(data.rol);
          setEstado(data.estado);
          
        } catch (err) {
          if (err instanceof Error) setError(err.message);
          else setError('Un error desconocido ocurrió');
        } finally {
          setLoading(false);
        }
      };

      fetchUsuario();
    }
  }, [id]); // Se ejecuta cada vez que el 'id' de la URL cambia


  // 5. Función para ACTUALIZAR el usuario (el botón "Guardar Cambios")
  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');

    try {
      // ¡MAGIA 2! Llama a tu API PUT por ID
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre, // Envía el nuevo nombre
          rol,    // Envía el nuevo rol
          estado, // Envía el nuevo estado
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo actualizar el usuario');
      }

      // ¡Éxito!
      alert('¡Usuario actualizado!');
      router.push('/dashboard-admin'); // Redirige de vuelta a la tabla

    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Un error desconocido ocurrió al actualizar');
    } finally {
      setIsUpdating(false);
    }
  };

  // --- JSX de Carga y Error ---
  if (loading) return <div className="p-8 text-gray-900">Cargando datos del usuario...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  // 6. MUESTRA EL FORMULARIO RELLENADO
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Editar Usuario
        </h1>

        <form onSubmit={handleActualizar} className="space-y-6">
          
          {/* Campo Email (deshabilitado, no se puede cambiar) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico (No se puede cambiar)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              disabled // Deshabilita el campo
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-500 bg-gray-200"
            />
          </div>

          {/* Campo Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
            />
          </div>

          {/* Campo Rol (Selector) */}
          <div>
            <label htmlFor="rol" className="block text-sm font-medium text-gray-700">
              Rol
            </label>
            <select
              id="rol"
              value={rol} // El 'value' se rellena con los datos del usuario
              onChange={(e) => setRol(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
            >
              {/* Aquí usamos los roles que nos dio el cliente */}
              <option value="" disabled>Selecciona un rol</option>
              <option value="Jefe de Taller">Jefe de Taller</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Coordinador">Coordinador</option>
              <option value="Mecánico">Mecánico</option>
              <option value="Guardia">Guardia</option>
              <option value="Gerente">Gerente</option>
              <option value="Vendedor">Vendedor</option>
              <option value="Conductor">Conductor</option>
            </select>
          </div>

          {/* Campo Estado (Selector) */}
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value as 'Activo' | 'Inactivo')}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          {/* Botón de Guardar Cambios */}
          <button
            type="submit"
            disabled={isUpdating}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}