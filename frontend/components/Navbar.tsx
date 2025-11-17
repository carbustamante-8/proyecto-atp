'use client'; 

import Link from 'next/link';
import Image from 'next/image';
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

  // No mostrar Navbar en la página de Login
  if (pathname === '/') return null; 
  
  // --- Navbar de Carga (Placeholder) ---
  // Se muestra mientras se valida la sesión
  if (loading || !userProfile) {
    return (
      <nav className="fixed top-0 left-0 w-full h-16 bg-pepsi-blue text-white shadow-lg z-50 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <Image
            src="/pepsico-logo.png"
            alt="Pepsi Logo"
            width={32}
            height={32}
            priority
          />
          <span className="font-semibold text-xl">Pepsi-Fleet</span>
        </div>
      </nav>
    ); 
  }

  // --- Navbar Principal (Rediseñado) ---
  return (
    <nav className="fixed top-0 left-0 w-full bg-pepsi-blue text-white shadow-lg z-50 font-sans">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        
        {/* Logo y Título */}
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/pepsico-logo.png"
            alt="Pepsi Logo"
            width={32}
            height={32}
            priority
          />
          <span className="font-bold text-xl">Pepsi-Fleet</span>
        </Link>

        {/* --- Enlaces de Navegación (con animaciones) --- */}
        <div className="hidden md:flex items-center space-x-2">
          
          {/* (Tu lógica de roles está perfecta, solo añadimos clases de estilo) */}
          
          {userProfile.rol === 'Supervisor' && (
            <>
              <Link href="/solicitudes-pendientes" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Bandeja de Taller</Link>
              <Link href="/agenda-taller" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Agenda/Asignar</Link>
              <Link href="/cierre-ots" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Cierre de OTs</Link>
              <Link href="/dashboard-admin" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Usuarios</Link>
              <Link href="/gestion-vehiculos" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Vehículos</Link>
              <Link href="/historial-accesos" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Historial Accesos</Link>
              <Link href="/generador-reportes" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Reportes</Link>
            </>
          )}

          {userProfile.rol === 'Jefe de Taller' && (
            <>
              <Link href="/agenda-taller" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Agenda/Asignar</Link>
              <Link href="/cierre-ots" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Cierre de OTs</Link>
              <Link href="/historial-accesos" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Historial Accesos</Link>
              <Link href="/generador-reportes" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Reportes</Link>
            </>
          )}

          {userProfile.rol === 'Coordinador' && (
            <>
              <Link href="/solicitudes-pendientes" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Bandeja de Taller</Link>
              <Link href="/agenda-taller" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Agenda</Link>
              <Link href="/dashboard-admin" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Usuarios</Link>
              <Link href="/gestion-vehiculos" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Vehículos</Link>
              <Link href="/generador-reportes" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Reportes</Link>
            </>
          )}
          
          {userProfile.rol === 'Gerente' && (
            <Link href="/generador-reportes" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Reportes</Link>
          )}
          {userProfile.rol === 'Mecánico' && (
            <Link href="/mis-tareas" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Mi Tablero</Link>
          )}
          {userProfile.rol === 'Guardia' && (
            <>
              <Link href="/control-acceso" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Registrar Ingreso</Link>
              <Link href="/registrar-salida" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Registrar Salida</Link>
              <Link href="/historial-accesos" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Bitácora</Link>
            </>
          )}
          {userProfile.rol === 'Conductor' && (
            <Link href="/portal-conductor" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-blue-dark transition-colors duration-200">Mi Portal</Link>
          )}
        </div>

        {/* Info de Usuario y Logout */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-200 hidden md:block">
            Hola, {userProfile.nombre} ({userProfile.rol})
          </span>
          <button 
            onClick={handleLogout}
            className="bg-pepsi-red text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-pepsi-red-dark transition-colors duration-200"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}