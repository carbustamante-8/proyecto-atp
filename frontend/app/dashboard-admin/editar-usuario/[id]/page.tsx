// frontend/app/dashboard-admin/editar-usuario/[id]/page.tsx
// (CÓDIGO VISUALMENTE REFACTORIZADO)

'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

// --- ¡NUEVO ESTILO PARA INPUTS! ---
// Usamos la misma constante para consistencia.
const inputStyle = "w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50 focus:ring-pepsi-blue focus:border-pepsi-blue";

export default function EditarUsuarioPage() {
  const [formData, setFormData] = useState({
    email: '',
    rol: '',
    nombre: '',
    apellido: '',
    rut: '',
    telefono: ''
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // Loading para cargar datos
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { user, userProfile, loading: authLoading } = useAuth();

  // (El useEffect de autenticación no cambia)
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Supervisor', 'Coordinador'];
        if (!rolesPermitidos.includes(userProfile.rol)) {
          toast.error('Acceso denegado');
          router.push('/');
        } else {
          fetchUsuario();
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // (La lógica de 'fetchUsuario', 'handleChange' y 'handleSubmit' no cambia)
  const fetchUsuario = async () => {
    setPageLoading(true);
    try {
      const response = await fetch(`/api/usuarios/${id}`);
      if (!response.ok) throw new Error('Usuario no encontrado');
      const data = await response.json();
      setFormData(data);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
      router.push('/dashboard-admin');
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const promise = fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    toast.promise(promise, {
      loading: 'Actualizando usuario...',
      success: (res) => {
        if (!res.ok) throw new Error('Error al actualizar');
        setLoading(false);
        router.push('/dashboard-admin');
        return 'Usuario actualizado exitosamente';
      },
      error: (err) => {
        setLoading(false);
        return err.message || 'Error al actualizar';
      }
    });
  };

  if (authLoading || pageLoading) {
    return <div className="p-8 text-gray-900">Validando sesión y cargando datos del usuario...</div>;
  }

  return (
    // --- ¡PÁGINA REFACTORIZADA! ---
    <div className="p-8 text-gray-900">
      
      {/* Título usa el color pepsi-blue */}
      <h1 className="text-3xl font-bold text-pepsi-blue mb-6">Editar Usuario</h1>

      {/* Tarjeta blanca para el formulario (como en el Login y Crear) */}
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Fila 1: Nombre y Apellido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                name="nombre"
                id="nombre"
                required
                className={inputStyle} // ¡Estilo estándar aplicado!
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
              <input
                type="text"
                name="apellido"
                id="apellido"
                required
                className={inputStyle} // ¡Estilo estándar aplicado!
                value={formData.apellido}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Fila 2: RUT y Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
              <input
                type="text"
                name="rut"
                id="rut"
                required
                className={inputStyle} // ¡Estilo estándar aplicado!
                value={formData.rut}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="text"
                name="telefono"
                id="telefono"
                required
                className={inputStyle} // ¡Estilo estándar aplicado!
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>
          </div>

          <hr className="my-6 border-t border-gray-200" />

          {/* Fila 3: Email y Rol */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (Correo)</label>
              <input
                type="email"
                name="email"
                id="email"
                required
                className={inputStyle} // ¡Estilo estándar aplicado!
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select
                name="rol"
                id="rol"
                required
                className={inputStyle} // ¡Estilo estándar aplicado!
                value={formData.rol}
                onChange={handleChange}
              >
                <option value="Supervisor">Supervisor</option>
                <option value="Jefe de Taller">Jefe de Taller</option>
                <option value="Coordinador">Coordinador</option>
                <option value="Mecánico">Mecánico</option>
                <option value="Guardia">Guardia</option>
                <option value="Conductor">Conductor</option>
                <option value="Gerente">Gerente</option>
              </select>
            </div>
          </div>

          {/* Fila 4: Botones de Acción */}
          <div className="flex justify-end space-x-4 pt-4">
            <Link href="/dashboard-admin">
              <span className="px-5 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium">
                Cancelar
              </span>
            </Link>
            
            {/* Botón principal usa el color pepsi-blue */}
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-md text-white bg-pepsi-blue hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}