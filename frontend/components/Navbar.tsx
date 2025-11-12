// frontend/components/Navbar.tsx
// (CÓDIGO ACTUALIZADO: "Gerente" separado de "Admin")

'use client'; 

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); 

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  // --- LÓGICA DE VISIBILIDAD ---
  if (pathname === '/') {
    return null; // Oculta en el Login
  }
  if (loading || !user || !userProfile) {
    return <div className="h-16 bg-white shadow-md"></div>; // Placeholder
  }

  // --- RENDERIZADO DE LA NAVBAR ---
  return (
    <nav className="bg-white shadow-md text-gray-900 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* 1. Logo/Título */}
        <Link href="/">
          <span className="font-bold text-xl" style={{ color: '#003DA5' }}>Pepsi-Fleet</span>
        </Link>

        {/* 2. Enlaces de Navegación (¡INTELIGENTES!) */}
        <div className="space-x-6">
          
          {/* --- ENLACES PARA ROLES ADMIN (Jefe, Supervisor, Coordinador) --- */}
          {['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol) && (
            <>
              {/* --- ¡AÑADE ESTA LÍNEA! --- */}
              <Link href="/solicitudes-pendientes" className="hover:text-blue-600">Solicitudes</Link>

              <Link href="/dashboard-admin" className="hover:text-blue-600">Usuarios</Link>
              <Link href="/gestion-vehiculos" className="hover:text-blue-600">Vehículos</Link>
              <Link href="/dashboard-jefe-taller" className="hover:text-blue-600">Ingresos Pendientes</Link>
              <Link href="/generador-reportes" className="hover:text-blue-600">Reportes</Link>
            </>
          )}
          {/* --- FIN DEL BLOQUE ADMIN --- */}

          {/* --- ¡NUEVO BLOQUE SOLO PARA GERENTE! --- */}
          {userProfile && userProfile.rol === 'Gerente' && (
            <>
              <Link href="/generador-reportes" className="hover:text-blue-600">Reportes</Link>
            </>
          )}
          {/* --- FIN DEL BLOQUE GERENTE --- */}

          {/* --- ENLACES PARA MECÁNICOS (Sin cambios) --- */}
          {userProfile && userProfile.rol === 'Mecánico' && (
            <>
              <Link href="/mis-tareas" className="hover:text-blue-600">Mi Tablero</Link>
            </>
          )}

          {/* --- ENLACES PARA GUARDIAS (Sin cambios) --- */}
          {userProfile && userProfile.rol === 'Guardia' && (
            <>
              <Link href="/control-acceso" className="hover:text-blue-600">Registrar Ingreso</Link>
              <Link href="/registrar-salida" className="hover:text-blue-600">Registrar Salida</Link>
            </>
          )}
          {/* --- ¡AÑADE ESTE BLOQUE PARA CONDUCTORES! --- */}
          {userProfile.rol === 'Conductor' && (
            <>
              <Link href="/portal-conductor" className="hover:text-blue-600">Mi Portal</Link>
            </>
          )}
        </div>

        {/* 3. Información de Usuario y Logout (Sin cambios) */}
        <div className="flex items-center">
          <span className="text-gray-700 mr-4">
            Hola, {userProfile.nombre} (<em className="text-sm">{userProfile.rol}</em>)
          </span>
          <button 
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg shadow font-semibold hover:bg-red-700 text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}