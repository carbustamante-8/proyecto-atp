// frontend/components/Navbar.tsx

'use client'; // <-- Es un componente de cliente

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Importa el "Cerebro"
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Hook para saber en qué URL estamos

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // El "Cerebro" (AuthProvider) detectará esto
      // y la lógica de las páginas nos redirigirá al login
      router.push('/');
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  // --- LÓGICA DE VISIBILIDAD ---
  // Si estamos en la página de Login, NO muestra nada
  if (pathname === '/') {
    return null;
  }
  
  // Si está cargando o no hay usuario (y no estamos en el login),
  // muestra una barra "fantasma" para que no salte la página
  if (loading || !user || !userProfile) {
    return <div className="h-16 bg-white"></div>; // Placeholder
  }

  // --- RENDERIZADO DE LA NAVBAR ---
  return (
    <nav className="bg-white shadow-md text-gray-900 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* 1. Logo/Título (Nombre: Pepsi-Fleet) */}
        <Link href="/">
          {/* Color Azul PepsiCo (#003DA5) */}
          <span className="font-bold text-xl" style={{ color: '#003DA5' }}>Pepsi-Fleet</span>
        </Link>

        {/* 2. Enlaces de Navegación (¡INTELIGENTES!) */}
        <div className="space-x-6">
          
          {/* --- ENLACES PARA ROLES ADMIN (Jefe, Supervisor, Coordinador) --- */}
          {['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol) && (
            <>
              <Link href="/dashboard-admin" className="hover:text-blue-600">Usuarios</Link>
              <Link href="/gestion-vehiculos" className="hover:text-blue-600">Vehículos</Link>
              <Link href="/dashboard-jefe-taller" className="hover:text-blue-600">Ingresos Pendientes</Link>
              {/* (Podríamos añadir Reportes aquí) */}
            </>
          )}

          {/* --- ENLACES PARA MECÁNICOS --- */}
          {userProfile.rol === 'Mecánico' && (
            <>
              <Link href="/mis-tareas" className="hover:text-blue-600">Mi Tablero</Link>
            </>
          )}

          {/* --- ENLACES PARA GUARDIAS --- */}
          {userProfile.rol === 'Guardia' && (
            <>
              <Link href="/control-acceso" className="hover:text-blue-600">Registrar Ingreso</Link>
            </>
          )}

        </div>

        {/* 3. Información de Usuario y Logout */}
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