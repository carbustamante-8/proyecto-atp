// frontend/components/Navbar.tsx
// (CÓDIGO ACTUALIZADO: Añadido enlace a "Cierre de OTs")

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

  if (pathname === '/') return null; 
  if (loading || !user || !userProfile) {
    return <div className="h-16 bg-white shadow-md"></div>; 
  }

  return (
    <nav className="bg-white shadow-md text-gray-900 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        
        <Link href="/">
          <span className="font-bold text-xl" style={{ color: '#003DA5' }}>Pepsi-Fleet</span>
        </Link>

        <div className="space-x-6">
          
          {/* --- ¡BLOQUE ADMIN ACTUALIZADO! --- */}
          {['Jefe de Taller', 'Supervisor', 'Coordinador'].includes(userProfile.rol) && (
            <>
              <Link href="/solicitudes-pendientes" className="hover:text-blue-600">Bandeja de Taller</Link>
              
              {/* --- ¡NUEVO ENLACE! --- */}
              <Link href="/cierre-ots" className="hover:text-blue-600">Cierre de OTs</Link>

              <Link href="/dashboard-admin" className="hover:text-blue-600">Usuarios</Link>
              <Link href="/gestion-vehiculos" className="hover:text-blue-600">Vehículos</Link>
              <Link href="/generador-reportes" className="hover:text-blue-600">Reportes</Link>
            </>
          )}
          {/* --- FIN DEL BLOQUE ADMIN --- */}

          {userProfile && userProfile.rol === 'Gerente' && (
            <>
              <Link href="/generador-reportes" className="hover:text-blue-600">Reportes</Link>
            </>
          )}

          {userProfile && userProfile.rol === 'Mecánico' && (
            <>
              <Link href="/mis-tareas" className="hover:text-blue-600">Mi Tablero</Link>
            </>
          )}

          {userProfile && userProfile.rol === 'Guardia' && (
            <>
              <Link href="/control-acceso" className="hover:text-blue-600">Registrar Ingreso</Link>
              <Link href="/registrar-salida" className="hover:text-blue-600">Registrar Salida</Link>
            </>
          )}
          
          {userProfile.rol === 'Conductor' && (
            <>
              <Link href="/portal-conductor" className="hover:text-blue-600">Mi Portal</Link>
            </>
          )}
        </div>

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