// app/gestion-repuestos/page.tsx

'use client'; // <-- Obligatorio, porque vamos a pedir datos

import { useState, useEffect } from 'react';
import Link from 'next/link'; // Para el botón de "Añadir Nuevo Repuesto"


// 1. Define un "tipo" para tus Repuestos (basado en tu maqueta)
type Repuesto = {
  id: string;
  codigo: string;
  nombre: string;
  marca: string;
  descripcion: string;
};

export default function GestionRepuestosPage() {
  
  // 2. Crea "estados" para guardar la lista de repuestos y la carga
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 3. Este "Hook" se ejecuta 1 vez cuando la página carga
  useEffect(() => {
    
    const fetchRepuestos = async () => {
      try {
        setLoading(true);
        setError('');
        
        // 4. ¡AQUÍ ESTÁ LA MAGIA! Llama a la API GET de repuestos
        const response = await fetch('/api/repuestos');
        
        if (!response.ok) {
          throw new Error('No se pudieron cargar los repuestos');
        }
        
        const data = await response.json();
        setRepuestos(data); // Guarda la lista en el estado
        
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('Un error desconocido ocurrió');
      } finally {
        setLoading(false); // Deja de cargar
      }
    };

    fetchRepuestos(); // Llama a la función al cargar la página
  }, []); // El array vacío `[]` significa "ejecutar solo 1 vez"


  // 5. MUESTRA LOS DATOS (Este JSX coincide con tu maqueta)
  return (
    <div className="p-8 text-gray-900"> {/* Contenedor principal */}
      
      {/* Cabecera: Título y Botón */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Catálogo de Repuestos</h1>
        
        {/* Este botón te llevará a la página para crear repuestos */}
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
            
            {/* Muestra "Cargando..." mientras busca los datos */}
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">Cargando repuestos...</td>
              </tr>
            )}

            {/* Muestra un error si falló la carga */}
            {error && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-red-500">{error}</td>
              </tr>
            )}

            {/* Muestra los datos cuando terminan de cargar */}
            {!loading && !error && repuestos.length > 0 ? (
              repuestos.map(repuesto => (
                <tr key={repuesto.id}>
                  <td className="px-6 py-4">{repuesto.codigo}</td>
                  <td className="px-6 py-4">{repuesto.nombre}</td>
                  <td className="px-6 py-4">{repuesto.marca}</td>
                  <td className="px-6 py-4">{repuesto.descripcion}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">Editar</button>
                    <button className="text-red-600 hover:text-red-900 ml-4">Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              // Muestra esto si no está cargando pero no hay repuestos
              !loading && !error && repuestos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">No se encontraron repuestos.</td>
                </tr>
              )
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}