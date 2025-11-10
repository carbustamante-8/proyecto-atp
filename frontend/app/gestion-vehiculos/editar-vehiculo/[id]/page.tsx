// frontend/app/gestion-vehiculos/editar-vehiculo/[id]/page.tsx
'use client'; 
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';


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
  const params = useParams();
  const id = params.id as string; 
  const router = useRouter();
  
  const [formData, setFormData] = useState<VehiculoData>({
    patente: '',
    modelo: '',
    año: 0,
    tipo_vehiculo: '',
    kilometraje: 0,
    id_chofer_asignado: null,
    estado: 'Activo',
  });
  
  const [choferes, setChoferes] = useState<UsuarioSimple[]>([]); 
  const [loading, setLoading] = useState(true); 
  const [isUpdating, setIsUpdating] = useState(false); 
  const [error, setError] = useState('');
  
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Jefe de Taller', 'Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          // ¡PERMITIDO! Carga los datos
          const fetchVehiculo = async () => {
            try {
              const response = await fetch(`/api/vehiculos/${id}`);
              if (!response.ok) throw new Error('No se pudo cargar este vehículo');
              const data: VehiculoData = await response.json();
              setFormData(data); 
            } catch (err) {
              if (err instanceof Error) setError(err.message);
            }
          };
          const fetchChoferes = async () => {
            try {
              const response = await fetch('/api/usuarios');
              const usuarios = await response.json();
              const listaChoferes = usuarios.filter((u: any) => u.rol === 'Conductor');
              setChoferes(listaChoferes);
            } catch (err) {
              console.error("Error cargando choferes:", err);
            }
          };
          Promise.all([fetchVehiculo(), fetchChoferes()]).then(() => {
            setLoading(false);
          });
        } else {
          router.push('/'); 
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router, id]);
  
  if (authLoading || loading) {
    return <div className="p-8 text-gray-900">Cargando datos del vehículo...</div>;
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };
  
  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');
    try {
      const response = await fetch(`/api/vehiculos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          año: parseInt(formData.año as any, 10) || null,
          kilometraje: parseInt(formData.kilometraje as any, 10) || 0,
        }),
      });
      if (!response.ok) throw new Error('No se pudo actualizar el vehículo');
      alert('¡Vehículo actualizado!');
      router.push('/gestion-vehiculos'); 
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Editar Vehículo</h1>
        {error && (<p className="text-red-500 text-center mb-4">{error}</p>)}
        <form onSubmit={handleActualizar} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Patente</label>
            <input type="text" name="patente" id="patente" value={formData.patente} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            />
          </div>
          {/* ... (resto de tus inputs) ... */}
           <div>
            <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">Modelo</label>
            <input type="text" name="modelo" id="modelo" value={formData.modelo} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="año" className="block text-sm font-medium text-gray-700">Año</label>
              <input type="number" name="año" id="año" value={formData.año || ''} onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              />
            </div>
            <div>
              <label htmlFor="kilometraje" className="block text-sm font-medium text-gray-700">Kilometraje</label>
              <input type="number" name="kilometraje" id="kilometraje" value={formData.kilometraje || ''} onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
              />
            </div>
          </div>
          <div>
            <label htmlFor="tipo_vehiculo" className="block text-sm font-medium text-gray-700">Tipo</label>
            <select name="tipo_vehiculo" id="tipo_vehiculo" value={formData.tipo_vehiculo} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            >
              <option value="Eléctrico">Eléctrico</option>
              <option value="Diésel">Diésel</option>
              <option value="Ventas">Vehículo de Ventas</option>
              <option value="Respaldo">Flota de Respaldo</option>
            </select>
          </div>
          <div>
            <label htmlFor="id_chofer_asignado" className="block text-sm font-medium text-gray-700">Chofer</label>
            <select name="id_chofer_asignado" id="id_chofer_asignado" value={formData.id_chofer_asignado || ''} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            >
              <option value="">Sin chofer fijo</option>
              {choferes.map(chofer => (
                <option key={chofer.id} value={chofer.id}>{chofer.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
            <select name="estado" id="estado" value={formData.estado} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="En Taller">En Taller</option>
            </select>
          </div>
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