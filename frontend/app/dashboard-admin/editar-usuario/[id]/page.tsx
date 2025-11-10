// frontend/app/dashboard-admin/editar-usuario/[id]/page.tsx
'use client'; 
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type UsuarioData = {
  nombre: string;
  email: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
};

export default function EditarUsuarioPage() {
  const params = useParams();
  const id = params.id as string; 
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol: '',
    estado: 'Activo' as 'Activo' | 'Inactivo',
  });
  
  const [loading, setLoading] = useState(true); 
  const [isUpdating, setIsUpdating] = useState(false); 
  const [error, setError] = useState('');
  
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          // ¡PERMITIDO! Carga los datos
          const fetchUsuario = async () => {
            try {
              const response = await fetch(`/api/usuarios/${id}`);
              if (!response.ok) throw new Error('No se pudo cargar este usuario');
              const data: UsuarioData = await response.json();
              setFormData(data); 
            } catch (err) {
              if (err instanceof Error) setError(err.message);
            } finally {
              setLoading(false);
            }
          };
          fetchUsuario();
        } else {
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router, id]);
  
  if (authLoading || loading) {
    return <div className="p-8 text-gray-900">Cargando datos del usuario...</div>;
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };
  
  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');
    try {
      const { nombre, rol, estado } = formData; 
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, rol, estado }),
      });
      if (!response.ok) throw new Error('No se pudo actualizar el usuario');
      alert('¡Usuario actualizado!');
      router.push('/dashboard-admin'); 
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Editar Usuario</h1>
        {error && (<p className="text-red-500 text-center mb-4">{error}</p>)}
        <form onSubmit={handleActualizar} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico (No se puede cambiar)
            </label>
            <input type="email" id="email" value={formData.email} disabled
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-500 bg-gray-200"
            />
          </div>
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            />
          </div>
          <div>
            <label htmlFor="rol" className="block text-sm font-medium text-gray-700">Rol</label>
            <select name="rol" id="rol" value={formData.rol} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            >
              <option value="Jefe de Taller">Jefe de Taller</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Coordinador">Coordinador</option>
              <option value="Mecánico">Mecánico</option>
              <option value="Guardia">Guardia</option>
              <option value="Conductor">Conductor</option> 
              <option value="Vendedor">Vendedor</option> 
              <option value="Gerente">Gerente</option> 
            </select>
          </div>
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
            <select name="estado" id="estado" value={formData.estado} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
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