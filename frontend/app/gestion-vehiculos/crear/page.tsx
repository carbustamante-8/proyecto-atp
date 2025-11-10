// frontend/app/gestion-vehiculos/crear/page.tsx
'use client'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type UsuarioSimple = {
  id: string;
  nombre: string;
};

export default function CrearVehiculoPage() {
  const [formData, setFormData] = useState({
    patente: '',
    modelo: '',
    año: '',
    tipo_vehiculo: '',
    kilometraje: '',
    id_chofer_asignado: '',
  });
  
  const [choferes, setChoferes] = useState<UsuarioSimple[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchChoferes();
        } else {
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchChoferes = async () => {
    try {
      const response = await fetch('/api/usuarios');
      const usuarios = await response.json();
      const listaChoferes = usuarios.filter((u: any) => u.rol === 'Conductor');
      setChoferes(listaChoferes);
    } catch (err) {
      console.error("Error cargando choferes:", err);
      setError('No se pudo cargar la lista de choferes.');
    }
  };
  
  if (authLoading || !userProfile) {
    return <div className="p-8 text-gray-900">Validando sesión y permisos...</div>;
  }
  
  const handleCrearVehiculo = async (e: React.FormEvent) => {
    e.preventDefault(); 
    const { patente, modelo, tipo_vehiculo, año, kilometraje, id_chofer_asignado } = formData;
    if (!patente || !modelo || !tipo_vehiculo) {
      setError('Patente, Modelo y Tipo son obligatorios.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/vehiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          año: parseInt(año) || null,
          kilometraje: parseInt(kilometraje) || 0,
          id_chofer_asignado: id_chofer_asignado || null,
        }),
      });
      if (!response.ok) throw new Error('Falló la creación del vehículo');
      router.push('/gestion-vehiculos');
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false); 
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Añadir Nuevo Vehículo a la Flota
        </h1>
        {error && (<p className="text-red-500 text-center mb-4">{error}</p>)}
        <form onSubmit={handleCrearVehiculo} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="patente" className="block text-sm font-medium text-gray-700">Patente</label>
              <input type="text" name="patente" id="patente" value={formData.patente} onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              />
            </div>
            <div>
              <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">Modelo</label>
              <input type="text" name="modelo" id="modelo" value={formData.modelo} onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="año" className="block text-sm font-medium text-gray-700">Año</label>
              <input type="number" name="año" id="año" value={formData.año} onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              />
            </div>
            <div>
              <label htmlFor="kilometraje" className="block text-sm font-medium text-gray-700">Kilometraje</label>
              <input type="number" name="kilometraje" id="kilometraje" value={formData.kilometraje} onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              />
            </div>
          </div>
          <div>
            <label htmlFor="tipo_vehiculo" className="block text-sm font-medium text-gray-700">Tipo de Vehículo</label>
            <select name="tipo_vehiculo" id="tipo_vehiculo" value={formData.tipo_vehiculo} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            >
              <option value="" disabled>Selecciona un tipo</option>
              <option value="Eléctrico">Eléctrico</option>
              <option value="Diésel">Diésel</option>
              <option value="Ventas">Vehículo de Ventas</option>
              <option value="Respaldo">Flota de Respaldo</option>
            </select>
          </div>
          <div>
            <label htmlFor="id_chofer_asignado" className="block text-sm font-medium text-gray-700">Chofer Asignado (Opcional)</label>
            <select name="id_chofer_asignado" id="id_chofer_asignado" value={formData.id_chofer_asignado} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            >
              <option value="">Sin chofer fijo</option>
              {choferes.map(chofer => (
                <option key={chofer.id} value={chofer.id}>{chofer.nombre}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Guardando...' : 'Añadir Vehículo'}
          </button>
        </form>
      </div>
    </div>
  );
}