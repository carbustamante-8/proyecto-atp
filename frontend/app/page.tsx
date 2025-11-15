// frontend/app/page.tsx
// (CÓDIGO CORREGIDO: Lógica de redirección eliminada, manejada por el Context)

'use client'; 
import { useState, useEffect } from 'react'; // ¡Añadido useEffect!
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast'; 
import Link from 'next/link';
import styles from './page.module.css'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // --- ¡SIMPLIFICADO! ---
  // Ya no necesitamos setUser o setUserProfile aquí
  const { user, userProfile, loading: authLoading } = useAuth(); 

  // --- ¡NUEVO! Redirige si el usuario YA ESTÁ logueado ---
  // (Esto maneja el F5 en la página de login)
  useEffect(() => {
    if (!authLoading && user && userProfile) {
      // Si ya está logueado, lo patea a su página (la lógica del Context lo hará)
      // Pero por si acaso, lo enviamos al hub del Jefe de Taller como fallback.
      if (userProfile.rol === 'Jefe de Taller') {
        router.push('/agenda-taller');
      } else {
        router.push('/mis-tareas'); // O cualquier otra página principal
      }
    }
  }, [user, userProfile, authLoading, router]);

  // --- ¡handleLogin (SIMPLIFICADO)! ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    toast.loading('Iniciando sesión...'); 
    
    try {
      // 1. Solo intenta iniciar sesión
      await signInWithEmailAndPassword(auth, email, password);
      
      // 2. ¡NO HAGAS NADA MÁS!
      // El 'AuthContext' detectará el cambio y
      // el 'useEffect' en el Context se encargará
      // de buscar el perfil y redirigir.
      toast.dismiss();
      
    } catch (error: any) {
      toast.dismiss();
      console.error("Error en login:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        toast.error('Email o contraseña incorrectos.');
      } else {
        toast.error(error.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false); 
    }
  };

  // Muestra una pantalla de carga si la autenticación está en proceso
  if (authLoading || (user && userProfile)) {
    return <div className="p-8 text-gray-900">Validando sesión...</div>;
  }
  
  // (Renderizado JSX - sin cambios)
  return (
    <div className={styles.container}>
      {/* Columna Izquierda (Logo) */}
      <div className={styles.leftColumn}>
        <Image
          src="/pepsico-logo.png"
          alt="PepsiCo Logo"
          width={400} 
          height={100} 
          priority 
        />
        <h2 className={styles.subtitle}>
          Gestión de Flota y Taller Mecánico
        </h2>
      </div>
      
      {/* Columna Derecha (Formulario) */}
      <div className={styles.rightColumn}>
        <div className={styles.loginBox}>
          <h2 className={styles.loginTitle}>Iniciar Sesión</h2>
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={styles.button}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
            <div className={styles.linkContainer}>
              <Link href="/recuperar-contrasena">
                <span className={styles.link}>
                  ¿Olvidaste tu contraseña?
                </span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}