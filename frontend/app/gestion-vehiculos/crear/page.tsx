'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

// --- ¡Estilo estándar para inputs (v3)! ---
// (Definido globalmente en globals.css, pero lo usamos aquí)
const inputStyle = "w-full px-4 py-3 border border-gray-300 rounded-md text-neutral-900 bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-pepsi-blue-light focus:border-transparent transition-shadow duration-200";

export default function CrearVehiculoPage() {
  
  // (Toda la lógica de 'useState', 'useEffect' y 'fetch' queda idéntica)
  const [formData, setFormData] = useState({
    patente: '',
    marca: '',
    modelo: '',
    año: '', // Año como string para el input
    tipo_vehiculo: '',
    estado: 'Operativo', // Estado por defecto
    color: '',
    vin: '',
    n_motor: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user && userProfile) {
        const rolesPermitidos = ['Supervisor', 'Coordinador'];
        if (!rolesPermitidos.includes(userProfile.rol)) {
          toast.error('Acceso denegado');
          router.push('/');
        }
      } else if (!user) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Convertir año a número antes de enviar
    const dataParaEnviar = {
      ...formData,
      año: parseInt(formData.año, 10)
    };

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
    return <div className="p-8 font-sans">Validando sesión...</div>;
  }

  // --- JSX REFACTORIZADO VISUALMENTE ---
  return (
    <div className="p-8 font-sans">
      
      {/* Título usa el color pepsi-blue */}
      <h1 className="text-3xl font-bold text-pepsi-blue mb-6">Registrar Nuevo Vehículo</h1>

      {/* Tarjeta blanca para el formulario */}
      {/* Usamos max-w-3xl porque este formulario es más ancho */}
      <div className="bg-white shadow-card rounded-lg p-8 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Fila 1: Datos Principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="patente" className="block text-sm font-medium text-neutral-700 mb-1">Patente</label>
              <input
                type="text"
                name="patente"
                id="patente"
                required
                className={inputStyle} // ¡Estilo estándar aplicado!
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="marca" className="block text-sm font-medium text-neutral-700 mb-1">Marca</label>
              <input
                type="text"
                name="marca"
                id="marca"
                required
                className={inputStyle} // ¡Estilo estándar aplicado!
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="modelo" className="block text-sm font-medium text-neutral-700 mb-1">Modelo</label>
              <input
                type="text"
                name="modelo"
                id="modelo"
                required
                className={inputStyle} // ¡Estilo estándar aplicado!
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Fila 2: Año, Tipo y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="año" className="block text-sm font-medium text-neutral-700 mb-1">Año</label>
              <input
                type="number"
                name="año"
                id="año"
                required
                className={inputStyle} // ¡Estilo estándar aplicado!
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="tipo_vehiculo" className="block text-sm font-medium text-neutral-700 mb-1">Tipo de Vehículo</label>
              <input
                type="text"
                name="tipo_vehiculo"
                id="tipo_vehiculo"
                required
                className={inputStyle} // ¡Estilo estándar aplicado!
                placeholder="Ej: Camión, Auto, Grúa"
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="estado" className="block text-sm font-medium text-neutral-700 mb-1">Estado</label>
              <select
                name="estado"
                id="estado"
                required
                className={inputStyle} // ¡Estilo estándar aplicado!
                value={formData.estado}
                onChange={handleChange}
              >
                <option value="Operativo">Operativo</option>
                <option value="En Taller">En Taller</option>
                <option value="De Baja">De Baja</option>
              </select>
            </div>
          </div>
          
          <hr className="my-6 border-t border-neutral-100" />

          {/* Fila 3: Datos Opcionales (pero importantes) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-neutral-700 mb-1">Color</label>
              <input
                type="text"
                name="color"
                id="color"
                className={inputStyle} // ¡Estilo estándar aplicado!
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="vin" className="block text-sm font-medium text-neutral-700 mb-1">VIN (N° Chasis)</label>
              <input
                type="text"
                name="vin"
                id="vin"
                className={inputStyle} // ¡Estilo estándar aplicado!
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="n_motor" className="block text-sm font-medium text-neutral-700 mb-1">N° de Motor</label>
              <input
                type="text"
                name="n_motor"
                id="n_motor"
                className={inputStyle} // ¡Estilo estándar aplicado!
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Fila 4: Botones de Acción */}
          <div className="flex justify-end space-x-4 pt-4">
            {/* Botón Cancelar (neutral) */}
            <Link 
              href="/gestion-vehiculos"
              className="px-5 py-2 rounded-md text-neutral-900 bg-neutral-100 hover:bg-neutral-200 font-medium transition-colors duration-200"
            >
              Cancelar
            </Link>
            
            {/* Botón principal usa el color pepsi-blue */}
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-md text-white bg-pepsi-blue hover:bg-pepsi-blue-dark font-medium transition-colors duration-200 disabled:bg-gray-400"
            >
              {loading ? 'Registrando...' : 'Registrar Vehículo'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}