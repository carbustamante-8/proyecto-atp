// app/dashboard-admin/crear-usuario/page.tsx

'use client'; // <-- Obligatorio, es un formulario interactivo

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Para redirigir después de crear

export default function CrearUsuarioPage() {
  
  // 1. Estados para guardar los datos del formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(''); // Estado para el <select>
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Hook para redirigir

  // 2. Función que se ejecuta al enviar el formulario
  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue
    
    // Validación simple
    if (!nombre || !email || !password || !rol) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 3. ¡AQUÍ ESTÁ LA MAGIA! Llama a tu API con método POST
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Envía los datos de los estados en el "body"
        body: JSON.stringify({
          nombre,
          email,
          rol,
          // NOTA: La contraseña (password) no la enviamos a Firestore
          // por seguridad. La API de 'usuarios' no la guarda.
          // El login real se debe crear en Firebase Authentication.
        }),
      });

      if (!response.ok) {
        // Si el servidor devuelve un error (ej: 500)
        throw new Error('Falló la creación del usuario');
      }

      // 4. ¡Éxito!
      console.log('Usuario creado exitosamente');
      
      // 5. Redirige al usuario de vuelta a la tabla de administración
      router.push('/dashboard-admin');

    } catch (err) {
      console.error(err);
      if (err instanceof Error) setError(err.message);
      else setError('Un error desconocido ocurrió');
    } finally {
      setLoading(false); // Deja de mostrar "Cargando..."
    }
  };

  // 6. JSX del formulario (basado en tu maqueta)
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Crear Nuevo Usuario
        </h1>

        <form onSubmit={handleCrearUsuario} className="space-y-6">
          
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
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingresa el nombre del usuario"
            />
          </div>

          {/* Campo Correo Electrónico */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingresa el correo electrónico"
            />
          </div>

          {/* Campo Contraseña (Temporal) */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingresa la contraseña"
            />
            <p className="mt-1 text-xs text-gray-500">
              Nota: La contraseña real se debe gestionar en Firebase Authentication.
            </p>
          </div>

          {/* Campo Rol (Selector) */}
          <div>
            <label htmlFor="rol" className="block text-sm font-medium text-gray-700">
              Rol
            </label>
            <select
              id="rol"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>Selecciona un rol</option>
              {/* Basado en tu maqueta de Admin Usuarios */}
              <option value="Administrador">Administrador</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Conductor">Conductor</option>
              <option value="Mecánico">Mecánico</option>
              <option value="Despachador">Despachador</option>
            </select>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <p className="text-red-500 text-center">{error}</p>
          )}

          {/* Botón de Crear Usuario */}
          <button
            type="submit"
            disabled={loading} // Deshabilita el botón mientras carga
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      </div>
    </div>
  );
}