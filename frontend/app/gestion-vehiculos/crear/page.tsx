// frontend/app/gestion-vehiculos/crear/page.tsx
// (CÓDIGO VISUALMENTE REFACTORIZADO Y AHORA PERMITE ASIGNACIÓN)

'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Definiciones de tipos necesarias
type User = {
  id: string;
  nombre: string;
};

// --- ¡ESTILO ESTÁNDAR PARA INPUTS! ---
const inputStyle = "w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-gray-50 focus:ring-pepsi-blue focus:border-pepsi-blue";

export default function CrearVehiculoPage() {
  const [formData, setFormData] = useState({
    patente: '',
    marca: '',
    modelo: '',
    año: '', 
    tipo_vehiculo: '',
    estado: 'Operativo', 
    color: '',
    vin: '',
    n_motor: '',
    // --- ¡NUEVO CAMPO PARA ASIGNACIÓN! ---
    id_chofer_asignado: '', 
  });
  const [conductores, setConductores] = useState<User[]>([]); // Lista de conductores
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  // --- LÓGICA DE FETCH DE CONDUCTORES ---
  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Supervisor', 'Coordinador'];
        if (rolesPermitidos.includes(userProfile.rol)) {
          fetchConductores();
        } else {
          toast.error('Acceso denegado');
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);
  
  const fetchConductores = async () => {
    try {
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('No se pudo cargar la lista de conductores');
      const usuarios: any[] = await response.json();
      setConductores(usuarios.filter(u => u.rol === 'Conductor'));
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    }
  };
  // --- FIN LÓGICA DE FETCH ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // --- LIMPIEZA Y PREPARACIÓN DE DATOS ---
    const dataParaEnviar = {
      ...formData,
      año: parseInt(formData.año, 10),
      // Limpia el ID del conductor inmediatamente antes de enviar (Doble Defensa)
      id_chofer_asignado: formData.id_chofer_asignado 
        ? formData.id_chofer_asignado.trim() 
        : null
    };
    // --- FIN PREPARACIÓN ---

    const promise = fetch('/api/vehiculos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataParaEnviar),
    });

    toast.promise(promise, {
      loading: 'Registrando vehículo...',
      success: (res) => {
        if (!res.ok) throw new Error('Error al registrar el vehículo');
        setLoading(false);
        router.push('/gestion-vehiculos');
        return 'Vehículo registrado exitosamente';
      },
      error: (err) => {
        setLoading(false);
        return err.message || 'Error al registrar';
      }
    });
  };

  if (authLoading) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }

  return (
    <div className="p-8 text-gray-900">
      
      <h1 className="text-3xl font-bold text-pepsi-blue mb-6">Registrar Nuevo Vehículo</h1>

      <div className="bg-white shadow-lg rounded-lg p-8 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Fila 1: Datos Principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ... (campos Patente, Marca, Modelo) ... */}
            <div>
              <label htmlFor="patente" className="block text-sm font-medium text-gray-700 mb-1">Patente</label>
              <input type="text" name="patente" id="patente" required className={inputStyle} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input type="text" name="marca" id="marca" required className={inputStyle} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input type="text" name="modelo" id="modelo" required className={inputStyle} onChange={handleChange} />
            </div>
          </div>

          {/* Fila 2: Año, Tipo y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ... (campos Año, Tipo Vehículo, Estado) ... */}
            <div>
              <label htmlFor="año" className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <input type="number" name="año" id="año" required className={inputStyle} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="tipo_vehiculo" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vehículo</label>
              <input type="text" name="tipo_vehiculo" id="tipo_vehiculo" required className={inputStyle} placeholder="Ej: Camión, Auto, Grúa" onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select name="estado" id="estado" required className={inputStyle} value={formData.estado} onChange={handleChange}>
                <option value="Operativo">Operativo</option>
                <option value="En Taller">En Taller</option>
                <option value="De Baja">De Baja</option>
              </select>
            </div>
          </div>
          
          {/* --- ¡NUEVA FILA DE ASIGNACIÓN! --- */}
          <div>
            <label htmlFor="id_chofer_asignado" className="block text-sm font-medium text-gray-700 mb-1">Conductor Asignado (Asignación Inmediata)</label>
            <select
              name="id_chofer_asignado"
              id="id_chofer_asignado"
              className={inputStyle}
              value={formData.id_chofer_asignado}
              onChange={handleChange}
            >
              <option value="">Ninguno (Dejar sin asignar)</option>
              {conductores.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          {/* --- FIN NUEVA FILA DE ASIGNACIÓN --- */}
          
          <hr className="my-6 border-t border-gray-200" />

          {/* Fila 3: Datos Opcionales (pero importantes) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ... (campos Color, VIN, N° Motor) ... */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input type="text" name="color" id="color" className={inputStyle} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">VIN (N° Chasis)</label>
              <input type="text" name="vin" id="vin" className={inputStyle} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="n_motor" className="block text-sm font-medium text-gray-700 mb-1">N° de Motor</label>
              <input type="text" name="n_motor" id="n_motor" className={inputStyle} onChange={handleChange} />
            </div>
          </div>

          {/* Fila 4: Botones de Acción */}
          <div className="flex justify-end space-x-4 pt-4">
            <Link href="/gestion-vehiculos">
              <span className="px-5 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium">
                Cancelar
              </span>
            </Link>
            
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-md text-white bg-pepsi-blue hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              {loading ? 'Registrando...' : 'Registrar Vehículo'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}