// frontend/app/gestion-repuestos/crear/page.tsx

'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Importar
import toast from 'react-hot-toast'; // <-- 1. Importar toast

export default function CrearRepuestoPage() {
  
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  // const [error, setError] = useState(''); // <-- 2. Ya no lo usamos
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { user, userProfile, loading: authLoading } = useAuth(); // Hook de Auth

  // --- LÓGICA DE PROTECCIÓN ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador', 'Gerente'];
        if (!rolesPermitidos.includes(userProfile.rol)) {
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // --- LÓGICA DE RETORNO TEMPRANO ---
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }

  // --- Función de Submit ---
  const handleCrearRepuesto = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!codigo || !nombre) {
      toast.error('El Código y el Nombre son obligatorios.'); // <-- 3. Cambiado
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/repuestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo,
          nombre,
          marca,
          descripcion,
        }),
      });
      if (!response.ok) throw new Error('Falló la creación del repuesto');
      toast.success(`Repuesto "${nombre}" creado.`); // <-- 3. Cambiado
      router.push('/gestion-repuestos');
    } catch (err) {
      if (err instanceof Error) toast.error(err.message); // <-- 3. Cambiado
    } finally {
      setLoading(false); 
    }
  };

  // --- RENDERIZADO DEL FORMULARIO ---
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Añadir Nuevo Repuesto
        </h1>

        <form onSubmit={handleCrearRepuesto} className="space-y-6">
          <div>
            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">Código</label>
            <input
              type="text" id="codigo" value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              placeholder="Ej: RP001"
            />
          </div>
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre del Repuesto</label>
            <input
              type="text" id="nombre" value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              placeholder="Ej: Filtro de Aceite"
            />
          </div>
          <div>
            <label htmlFor="marca" className="block text-sm font-medium text-gray-700">Marca</label>
            <input
              type="text" id="marca" value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              placeholder="Ej: AutoParts"
            />
          </div>
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              id="descripcion" value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              placeholder="Ej: Filtro de aceite para motor..."
            />
          </div>
          {/* El error ahora es un Toast */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Guardando...' : 'Añadir Repuesto'}
          </button>
        </form>
      </div>
    </div>
  );
}