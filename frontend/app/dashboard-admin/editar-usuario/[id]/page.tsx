// frontend/app/dashboard-admin/editar-usuario/[id]/page.tsx
// (CÓDIGO CORREGIDO: Solucionado el error "uncontrolled input" para RUT)

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

// ¡Definimos el tipo con valores NO NULOS!
type UserData = {
  email: string;
  nombre: string;
  rut: string; // Ya no es opcional, será string vacío
  rol: string;
  estado: string;
};

function EditarUsuarioForm() {
  
  // --- ¡ESTADO INICIAL CORREGIDO! ---
  // Inicializamos con valores por defecto (strings vacíos)
  const [userData, setUserData] = useState<UserData>({
    email: '',
    nombre: '',
    rut: '', // <-- Inicia como string vacío
    rol: 'Mecánico',
    estado: 'Activo',
  });
  
  // 'loadingSubmit' es para el botón, 'loadingPage' es para cargar datos
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true); // ¡Importante!
  
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, userProfile, loading: authLoading } = useAuth();

  // (useEffect de protección - sin cambios)
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        // (Roles corregidos según el reparto de vistas)
        const rolesPermitidos = ['Supervisor', 'Coordinador'];
        if (!rolesPermitidos.includes(userProfile.rol)) {
          toast.error('No tienes permiso para acceder a esta página.');
          router.push('/');
        } else {
          fetchUserData();
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router, id]); // 'id' debe estar aquí

  // --- fetchUserData (CORREGIDO) ---
  const fetchUserData = async () => {
    if (!id) return;
    setLoadingPage(true); // <-- Usa el estado de página
    try {
      const response = await fetch(`/api/usuarios/${id}`);
      if (!response.ok) {
        throw new Error('Usuario no encontrado');
      }
      const data = await response.json();
      
      // --- ¡CORRECCIÓN! ---
      // Aseguramos que 'rut' nunca sea 'null' o 'undefined'
      setUserData({
        ...data,
        rut: data.rut || '', // <-- Si es null/undefined, usa string vacío
      });
      
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      router.push('/dashboard-admin');
    } finally {
      setLoadingPage(false); // <-- Usa el estado de página
    }
  };

  // --- handleActualizarUsuario (CORREGIDO) ---
  const handleActualizarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true); // <-- Usa el estado de botón
    toast.loading('Actualizando usuario...');
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        // 'userData' ya tiene los valores correctos
        body: JSON.stringify(userData), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el usuario');
      }

      toast.dismiss();
      toast.success('¡Usuario actualizado exitosamente!');
      router.push('/dashboard-admin');
    } catch (error) {
      toast.dismiss();
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setLoadingSubmit(false); // <-- Usa el estado de botón
    }
  };

  // --- handleChange (CORREGIDO) ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    // Ahora 'prev' siempre está definido, no necesitamos 'prev ? ...'
    setUserData(prev => ({ ...prev, [id]: value })); 
  };

  // --- PANTALLA DE CARGA CORREGIDA ---
  if (authLoading || loadingPage) {
    return <div className="p-8 text-gray-900">Cargando...</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Editar Usuario
        </h1>
        <form onSubmit={handleActualizarUsuario} className="space-y-6">
          
          {/* (Email - sin cambios) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (No editable)</label>
            <input type="email" id="email" value={userData.email} disabled
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-500 bg-gray-200" />
          </div>
          
          {/* (Nombre - sin cambios) */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
            <input type="text" id="nombre" value={userData.nombre} onChange={handleChange} required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
          </div>
          
          {/* (RUT - ¡CORREGIDO!) */}
          <div>
            <label htmlFor="rut" className="block text-sm font-medium text-gray-700">RUT</label>
            <input type="text" id="rut" value={userData.rut} onChange={handleChange} // <-- Ahora es seguro
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50" />
          </div>
          
          {/* (Rol y Estado - sin cambios) */}
          <div>
            <label htmlFor="rol" className="block text-sm font-medium text-gray-700">Rol</label>
            <select id="rol" value={userData.rol} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50">
              <option value="Jefe de Taller">Jefe de Taller</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Coordinador">Coordinador</option>
              <option value="Mecánico">Mecánico</option>
              <option value="Guardia">Guardia</option>
              <option value="Conductor">Conductor</option>
              <option value="Gerente">Gerente</option>
            </select>
          </div>
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
            <select id="estado" value={userData.estado} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50">
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          {/* (Botones - sin cambios) */}
          <div className="space-y-4 pt-4">
            <button
              type="submit"
              disabled={loadingSubmit}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loadingSubmit ? 'Actualizando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard-admin')}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default function EditarUsuarioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-900">Cargando...</div>}>
      <EditarUsuarioForm />
    </Suspense>
  );
}