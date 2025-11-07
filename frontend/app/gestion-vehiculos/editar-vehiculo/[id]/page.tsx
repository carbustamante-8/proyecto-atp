// app/gestion-vehiculos/editar-vehiculo/[id]/page.tsx

'use client'; // <-- Obligatorio, es un formulario interactivo

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Hooks para leer la URL y redirigir

// Tipos para los datos
type VehiculoData = {
  patente: string;
  modelo: string;
  año: number;
  tipo_vehiculo: string;
  kilometraje: number;
  id_chofer_asignado: string | null;
  estado: string;
};

type UsuarioSimple = {
  id: string;
  nombre: string;
};

export default function EditarVehiculoPage() {
  
  // 1. Hooks para leer el ID de la URL y para redirigir
  const params = useParams();
  const id = params.id as string; // 'id' viene del nombre de la carpeta [id]
  const router = useRouter();

  // 2. Estados para el formulario y la carga
  const [formData, setFormData] = useState<VehiculoData>({
    patente: '',
    modelo: '',
    año: 0,
    tipo_vehiculo: '',
    kilometraje: 0,
    id_chofer_asignado: null,
    estado: 'Activo',
  });
  
  const [choferes, setChoferes] = useState<UsuarioSimple[]>([]); // Para el <select>
  const [loading, setLoading] = useState(true); // Para el "Cargando..." inicial
  const [isUpdating, setIsUpdating] = useState(false); // Para el botón de "Guardar"
  const [error, setError] = useState('');

  // 3. Hook para BUSCAR los datos del vehículo y los choferes
  useEffect(() => {
    if (id) {
      // Función para buscar el vehículo
      const fetchVehiculo = async () => {
        try {
          const response = await fetch(`/api/vehiculos/${id}`);
          if (!response.ok) throw new Error('No se pudo cargar este vehículo');
          const data: VehiculoData = await response.json();
          setFormData(data); // Rellena el formulario con los datos de la BD
        } catch (err) {
          if (err instanceof Error) setError(err.message);
        }
      };

      // Función para buscar los choferes
      const fetchChoferes = async () => {
        try {
          const response = await fetch('/api/usuarios');
          const usuarios = await response.json();
          const listaChoferes = usuarios.filter((u: any) => u.rol === 'Conductor');
          setChoferes(listaChoferes);
        } catch (err) {
          console.error("Error cargando choferes:", err);
          // No es un error crítico, así que solo lo mostramos en consola
        }
      };

      // Ejecuta ambas peticiones
      Promise.all([fetchVehiculo(), fetchChoferes()]).then(() => {
        setLoading(false); // Deja de cargar cuando ambas terminan
      });
    }
  }, [id]); // Se ejecuta cada vez que el 'id' de la URL cambia


  // 4. Función para manejar los cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  // 5. Función para ACTUALIZAR el vehículo (el botón "Guardar Cambios")
  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');

    try {
      // ¡MAGIA! Llama a tu API PUT por ID
      const response = await fetch(`/api/vehiculos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Convierte a número por si acaso
          año: parseInt(formData.año as any, 10) || null,
          kilometraje: parseInt(formData.kilometraje as any, 10) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo actualizar el vehículo');
      }

      // ¡Éxito!
      alert('¡Vehículo actualizado!');
      router.push('/gestion-vehiculos'); // Redirige de vuelta a la tabla

    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Un error desconocido ocurrió al actualizar');
    } finally {
      setIsUpdating(false);
    }
  };

  // --- JSX de Carga y Error ---
  if (loading) return <div className="p-8 text-gray-900">Cargando datos del vehículo...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  // 6. MUESTRA EL FORMULARIO RELLENADO
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Editar Vehículo
        </h1>

        <form onSubmit={handleActualizar} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            {/* Campo Patente */}
            <div>
              <label htmlFor="patente" className="block text-sm font-medium text-gray-700">
                Patente
              </label>
              <input
                type="text" name="patente" id="patente"
                value={formData.patente}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              />
            </div>
            {/* Campo Modelo */}
            <div>
              <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">
                Modelo
              </label>
              <input
                type="text" name="modelo" id="modelo"
                value={formData.modelo}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Campo Año */}
            <div>
              <label htmlFor="año" className="block text-sm font-medium text-gray-700">
                Año
              </label>
              <input
                type="number" name="año" id="año"
                value={formData.año || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              />
            </div>
            {/* Campo Kilometraje */}
            <div>
              <label htmlFor="kilometraje" className="block text-sm font-medium text-gray-700">
                Kilometraje
              </label>
              <input
                type="number" name="kilometraje" id="kilometraje"
                value={formData.kilometraje || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              />
            </div>
          </div>
          
          {/* Campo Tipo de Vehículo */}
          <div>
            <label htmlFor="tipo_vehiculo" className="block text-sm font-medium text-gray-700">
              Tipo de Vehículo
            </label>
            <select
              name="tipo_vehiculo" id="tipo_vehiculo"
              value={formData.tipo_vehiculo}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            >
              <option value="" disabled>Selecciona un tipo</option>
              <option value="Eléctrico">Eléctrico</option>
              <option value="Diésel">Diésel</option>
              <option value="Ventas">Vehículo de Ventas</option>
              <option value="Respaldo">Flota de Respaldo</option>
            </select>
          </div>

          {/* Campo Chofer Asignado */}
          <div>
            <label htmlFor="id_chofer_asignado" className="block text-sm font-medium text-gray-700">
              Chofer Asignado
            </label>
            <select
              name="id_chofer_asignado" id="id_chofer_asignado"
              value={formData.id_chofer_asignado || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            >
              <option value="">Sin chofer fijo</option>
              {choferes.map(chofer => (
                <option key={chofer.id} value={chofer.id}>{chofer.nombre}</option>
              ))}
            </select>
          </div>
          
          {/* Campo Estado */}
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              name="estado" id="estado"
              value={formData.estado}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="En Taller">En Taller</option>
            </select>
          </div>

          {/* Botón de Guardar Cambios */}
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