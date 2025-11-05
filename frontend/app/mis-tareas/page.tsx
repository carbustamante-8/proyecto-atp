// app/mis-tareas/page.tsx

'use client'; // <-- Obligatorio, porque vamos a pedir datos


import Link from 'next/link';
import { useState, useEffect } from 'react';

// 1. Define un "tipo" para tus Órdenes de Trabajo (basado en la API)
type OrdenDeTrabajo = {
  id: string;
  descripcionProblema: string; 
  estado: 'Pendiente' | 'En Progreso' | 'Finalizado'; // (Ajusta los estados si es necesario)
  patente: string;
  // ... (otros campos que quieras mostrar, como un N° de OT si lo tienes)
};

export default function MisTareasPage() {
  
  // 2. Crea "estados" para guardar los datos y el estado de carga
  const [ordenes, setOrdenes] = useState<OrdenDeTrabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 3. Este "Hook" se ejecuta 1 vez cuando la página carga
  useEffect(() => {
    
    // 4. Define la función para "ir a buscar" los datos a tu API
    const fetchOrdenes = async () => {
      try {
        setLoading(true);
        
        // ¡AQUÍ ESTÁ LA MAGIA! Llama a la API que creaste
        const response = await fetch('/api/ordenes-trabajo');
        
        if (!response.ok) {
          throw new Error('No se pudieron cargar las órdenes de trabajo');
        }
        
        const data = await response.json();
        setOrdenes(data); // Guarda los datos en el estado
        
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('Un error desconocido ocurrió');
      } finally {
        setLoading(false); // Deja de cargar, ya sea éxito o error
      }
    };

    fetchOrdenes(); // Llama a la función
  }, []); // El array vacío `[]` significa "ejecutar solo 1 vez"


  // 5. Filtra las órdenes por estado (para tus 3 columnas)
  const pendientes = ordenes.filter(ot => ot.estado === 'Pendiente');
  const enProgreso = ordenes.filter(ot => ot.estado === 'En Progreso');
  const finalizadas = ordenes.filter(ot => ot.estado === 'Finalizado'); // (Asumiendo que 'Finalizado' es un estado)

  // 6. Muestra un mensaje mientras los datos cargan
  if (loading) {
    return <div className="p-8 text-gray-900">Cargando tablero...</div>;
  }

  // 7. Muestra un mensaje si hubo un error
  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  // 8. MUESTRA LOS DATOS (Este es el JSX de tu vista)
  return (
    <div className="p-8 text-gray-900">
      <h1 className="text-3xl font-bold">Mi Tablero</h1>
      <p className="text-gray-600 mb-6">Vista personal de las órdenes de trabajo asignadas</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Columna Pendientes */}
        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h2 className="font-bold text-xl mb-4 text-red-600">Pendientes</h2>
          <div className="space-y-3">
            {pendientes.length > 0 ? (
              pendientes.map(ot => (
                <Link href={`/tareas-detalle/${ot.id}`} key={ot.id}>
                  <div className="bg-white p-3 rounded shadow cursor-pointer hover:shadow-md">
                    <p className="font-semibold">{ot.descripcionProblema}</p>
                    <p className="text-sm text-gray-500">Patente: {ot.patente}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500">No hay tareas pendientes.</p>
            )}
          </div>
        </div>

        {/* Columna En Progreso */}
        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h2 className="font-bold text-xl mb-4 text-yellow-600">En Progreso</h2>
          <div className="space-y-3">
            {enProgreso.length > 0 ? (
              enProgreso.map(ot => (
                <Link href={`/tareas-detalle/${ot.id}`} key={ot.id}>
                  <div className="bg-white p-3 rounded shadow cursor-pointer hover:shadow-md">
                    <p className="font-semibold">{ot.descripcionProblema}</p>
                    <p className="text-sm text-gray-500">Patente: {ot.patente}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500">No hay tareas en progreso.</p>
            )}
          </div>
        </div>

        {/* Columna Finalizadas */}
        <div className="bg-gray-100 p-4 rounded-lg shadow">
          <h2 className="font-bold text-xl mb-4 text-green-600">Finalizadas Hoy</h2>
          <div className="space-y-3">
            {finalizadas.length > 0 ? (
              finalizadas.map(ot => (
                <Link href={`/tareas-detalle/${ot.id}`} key={ot.id}>
                  <div className="bg-white p-3 rounded shadow cursor-pointer hover:shadow-md">
                    <p className="font-semibold">{ot.descripcionProblema}</p>
                    <p className="text-sm text-gray-500">Patente: {ot.patente}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500">No hay tareas finalizadas.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}