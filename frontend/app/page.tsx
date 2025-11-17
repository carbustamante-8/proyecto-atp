// frontend/app/page.tsx
// (ACTUALIZADO: JSX limpiado para coincidir con el nuevo CSS)

'use client'; 
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth, db } from '../lib/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { useAuth, UserProfile } from '../context/AuthContext';
import toast from 'react-hot-toast'; 
import Link from 'next/link';
import styles from './page.module.css'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const { user, userProfile, loading: authLoading } = useAuth(); 

  // (useEffect para redirigir si ya está logueado - sin cambios)
  useEffect(() => {
    if (!authLoading && user && userProfile) {
      if (userProfile.rol === 'Jefe de Taller') {
        router.push('/agenda-taller');
      } else if (userProfile.rol === 'Supervisor') {
        router.push('/dashboard-admin'); 
      } else if (userProfile.rol === 'Coordinador') {
        router.push('/dashboard-admin'); 
      } else if (userProfile.rol === 'Mecánico') {
        router.push('/mis-tareas'); 
      } else if (userProfile.rol === 'Guardia') {
        router.push('/control-acceso'); 
      } else if (userProfile.rol === 'Conductor') {
        router.push('/portal-conductor'); 
      } else if (userProfile.rol === 'Gerente') {
        router.push('/generador-reportes'); 
      } else {
        router.push('/'); 
      }
    }
  }, [user, userProfile, authLoading, router]);

  // (handleLogin - sin cambios en la lógica)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    toast.loading('Iniciando sesión...'); 
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // El AuthContext (que ya corregimos) se encargará de
      // buscar el perfil y redirigir automáticamente.
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

  // Muestra pantalla de carga si la sesión se está validando
  if (authLoading || (user && userProfile)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-text-secondary">Validando sesión...</p>
      </div>
    );
  }
  
  // --- JSX del Login (Moderno) ---
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