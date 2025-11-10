// frontend/app/gestion-repuestos/page.tsx

'use client'; 

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; // Importar
import { useRouter } from 'next/navigation';   // Importar
import toast from 'react-hot-toast'; // <-- 1. Importar toast

type Repuesto = {
  id: string;
  codigo: string;
  nombre: string;
  marca: string;
  descripcion: string;
};

export default function GestionRepuestosPage() {
  
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(false); 
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- LÓGICA DE PROTECCIÓN Y CARGA ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        // (Aunque el cliente pausó este módulo, si lo van a usar, 
        // lo lógico es que solo los Admins puedan verlo)
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador', 'Gerente'];
        
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchRepuestos();
        } else {
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // Función de carga
  const fetchRepuestos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/repuestos');
      if (!response.ok) throw new Error('No se pudieron cargar los repuestos');
      const data = await response.json();
      setRepuestos(data); 
    } catch (err) {
      if (err instanceof Error) toast.error(err.message); // <-- 3. Cambiado
    } finally {
      setLoading(false); 
    }
  };
  
  // --- Función de Eliminar (¡NUEVA!) ---
  // (Añadimos esta lógica para que sea consistente con los otros módulos)
  const handleEliminar = async (repuestoId: string, nombre: string) => {
    if (!confirm(`¿Seguro que quieres eliminar el repuesto "${nombre}"?`)) return;
    try {
      const response = await fetch(`/api/repuestos?id=${repuestoId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar el repuesto');
      setRepuestos(r => r.filter(rep => rep.id !== repuestoId));
      toast.success(`Repuesto "${nombre}" eliminado.`); // <-- 3. Cambiado
    } catch (err) {
      if (err instanceof Error) toast.error(err.message); // <-- 3. Cambiado
    }
  };

  // --- LÓGICA DE RETORNO TEMPRANO ---
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  // --- RENDERIZADO DE LA PÁGINA ---
  return (
    <div className="p-8 text-gray-900"> 
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Catálogo de Repuestos</h1>
        <Link href="/gestion-repuestos/crear"> 
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-blue-700">
            + Añadir Nuevo Repuesto
          </button>
        </Link>
      </div>

      {/* Tabla de Repuestos */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Cargando repuestos...</td></tr>
            )}
            {/* El error ahora es un Toast */}
            {!loading && repuestos.length > 0 ? (
              repuestos.map(repuesto => (
                <tr key={repuesto.id}>
                  <td className="px-6 py-4">{repuesto.codigo}</td>
                  <td className="px-6 py-4">{repuesto.nombre}</td>
                  <td className="px-6 py-4">{repuesto.marca}</td>
                  <td className="px-6 py-4">{repuesto.descripcion}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {/* (El botón de Editar aún no lo hemos conectado) */}
                    <button className="text-blue-600 hover:text-blue-900 disabled:text-gray-400" disabled>Editar</button>
                    <button onClick={() => handleEliminar(repuesto.id, repuesto.nombre)} className="text-red-600 hover:text-red-900 ml-4">Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              !loading && repuestos.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-4 text-center">No se encontraron repuestos.</td></tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}