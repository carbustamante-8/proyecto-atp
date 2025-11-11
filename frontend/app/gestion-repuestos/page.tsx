// frontend/app/gestion-repuestos/page.tsx
// (CÓDIGO ACTUALIZADO CON MODAL SIN FONDO NEGRO)

'use client'; 
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast'; 

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
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [repuestoParaBorrar, setRepuestoParaBorrar] = useState<{id: string, nombre: string} | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
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

  const fetchRepuestos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/repuestos');
      if (!response.ok) throw new Error('No se pudieron cargar los repuestos');
      const data = await response.json();
      setRepuestos(data); 
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoading(false); 
    }
  };
  
  // --- Lógica del Modal ---
  const handleAbrirModalEliminar = (id: string, nombre: string) => {
    setRepuestoParaBorrar({ id, nombre });
    setModalAbierto(true);
  };
  const handleCerrarModalEliminar = () => {
    setModalAbierto(false);
    setRepuestoParaBorrar(null);
  };
  const handleConfirmarEliminar = async () => {
    if (!repuestoParaBorrar) return;
    try {
      const response = await fetch(`/api/repuestos?id=${repuestoParaBorrar.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar el repuesto');
      setRepuestos(r => r.filter(rep => rep.id !== repuestoParaBorrar.id));
      toast.success(`Repuesto "${repuestoParaBorrar.nombre}" eliminado.`);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      handleCerrarModalEliminar();
    }
  };

  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  return (
    <>
      {/* --- MODAL (SIN FONDO NEGRO) --- */}
      {modalAbierto && repuestoParaBorrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0" 
            onClick={handleCerrarModalEliminar}
          ></div>
          <div className="relative z-10 bg-white p-8 rounded-lg shadow-xl max-w-sm w-full border border-gray-300">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que quieres eliminar el repuesto
              <strong className="text-red-600"> {repuestoParaBorrar.nombre}</strong>?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCerrarModalEliminar}
                className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEliminar}
                className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 font-medium"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- FIN DEL MODAL --- */}

      <div className="p-8 text-gray-900"> 
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestión de Catálogo de Repuestos</h1>
          <Link href="/gestion-repuestos/crear"> 
            <button className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-blue-700">
              + Añadir Nuevo Repuesto
            </button>
          </Link>
        </div>
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
              {!loading && repuestos.length > 0 ? (
                repuestos.map(repuesto => (
                  <tr key={repuesto.id}>
                    <td className="px-6 py-4">{repuesto.codigo}</td>
                    <td className="px-6 py-4">{repuesto.nombre}</td>
                    <td className="px-6 py-4">{repuesto.marca}</td>
                    <td className="px-6 py-4">{repuesto.descripcion}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 disabled:text-gray-400" disabled>Editar</button>
                      <button onClick={() => handleAbrirModalEliminar(repuesto.id, repuesto.nombre)} className="text-red-600 hover:text-red-900 ml-4">Eliminar</button>
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
    </>
  );
}