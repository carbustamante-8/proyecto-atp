// app/dashboard-jefe-taller/page.tsx

'use client'; // <-- Obligatorio, porque vamos a pedir datos

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Para redirigir

// 1. Define un "tipo" para los Registros de Ingreso
type RegistroIngreso = {
  id: string;
  patente: string;
  chofer: string;
  motivoIngreso: string;
  kilometraje: number;
  zonaOrigen: string;
  fechaIngreso: { // Firebase devuelve un objeto Timestamp
    _seconds: number;
  };
};

export default function DashboardJefeTallerPage() {
  
  // 2. Crea "estados" para guardar la lista de ingresos y la carga
  const [registros, setRegistros] = useState<RegistroIngreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // 3. Este "Hook" se ejecuta 1 vez cuando la página carga
  useEffect(() => {
    
    const fetchRegistros = async () => {
      try {
        setLoading(true);
        
        // 4. ¡AQUÍ ESTÁ LA MAGIA! Llama a la API GET de registros
        const response = await fetch('/api/registros-acceso');
        
        if (!response.ok) {
          throw new Error('No se pudieron cargar los registros de ingreso');
        }
        
        const data = await response.json();
        setRegistros(data); // Guarda la lista en el estado
        
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('Un error desconocido ocurrió');
      } finally {
        setLoading(false); // Deja de cargar
      }
    };

    fetchRegistros(); // Llama a la función al cargar la página
  }, []); // El array vacío `[]` significa "ejecutar solo 1 vez"

  // 5. Función (ACTIVADA) para manejar la creación de OT
  const handleCrearOT = (registro: RegistroIngreso) => {
    console.log('Enviando datos al formulario de OT:', registro.patente);

    // Codificamos los datos para que viajen seguros en la URL
    // (ej: "Falla en motor" se convierte en "Falla%20en%20motor")
    const patente = encodeURIComponent(registro.patente);
    const motivo = encodeURIComponent(registro.motivoIngreso);

    // ¡AQUÍ ESTÁ LA MAGIA! Redirige al formulario pasándole los datos
    router.push(`/crear-ot?patente=${patente}&motivo=${motivo}`);
  };

  // 6. MUESTRA LOS DATOS
  return (
    <div className="p-8 text-gray-900"> {/* Contenedor principal */}
      
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard Jefe de Taller</h1>
        <p className="text-gray-600">Vehículos pendientes de asignación</p>
      </div>

      {/* Tabla de Registros de Ingreso */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chofer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo de Ingreso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kilometraje</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Ingreso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            
            {/* Muestra "Cargando..." mientras busca los datos */}
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">Cargando ingresos...</td>
              </tr>
            )}

            {/* Muestra un error si falló la carga */}
            {error && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-red-500">{error}</td>
              </tr>
            )}

            {/* Muestra los datos cuando terminan de cargar */}
            {!loading && !error && registros.length > 0 ? (
              registros.map(reg => (
                <tr key={reg.id}>
                  <td className="px-6 py-4 font-medium">{reg.patente}</td>
                  <td className="px-6 py-4">{reg.chofer}</td>
                  <td className="px-6 py-4">{reg.motivoIngreso}</td>
                  <td className="px-6 py-4">{reg.kilometraje}</td>
                  <td className="px-6 py-4">
                    {/* Formatea la fecha de Firebase para que sea legible */}
                    {new Date(reg.fechaIngreso._seconds * 1000).toLocaleString('es-CL')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button 
                      onClick={() => handleCrearOT(reg)}
                      className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
                    >
                      Crear OT
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              // Muestra esto si no está cargando pero no hay registros
              !loading && !error && registros.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">No hay vehículos pendientes de ingreso.</td>
                </tr>
              )
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}