// frontend/app/page.tsx
// (CÓDIGO CORREGIDO: Mantiene el estilo "moderno" y arregla la lógica de redirección)

'use client'; 
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth, db } from '../lib/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { useAuth, UserProfile } from '../context/AuthContext';
import toast from 'react-hot-toast'; 
import Link from 'next/link'; // <-- ¡ARREGLO 1: Importación añadida!
import styles from './page.module.css'; // <-- Tu estilo "moderno"

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setUserProfile } = useAuth(); // <-- Funciona gracias al AuthContext corregido

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    toast.loading('Iniciando sesión...'); 
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      setUser(user); 

      const userProfileRef = doc(db, "usuarios", user.uid);
      const userProfileSnapshot = await getDoc(userProfileRef);

      if (userProfileSnapshot.exists()) {
        const userProfile = userProfileSnapshot.data() as UserProfile;
        setUserProfile(userProfile); 
        
        toast.dismiss();
        toast.success(`¡Bienvenido, ${userProfile.nombre}!`);

        // --- ¡ARREGLO 2: Lógica de redirección corregida! ---
        if (userProfile.rol === 'Jefe de Taller') {
          router.push('/agenda-taller'); // <-- El destino correcto
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
      } else {
        throw new Error("No se encontró tu perfil de usuario (rol).");
      }
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

  // --- ¡TU DISEÑO "MODERNO" ESTÁ AQUÍ! ---
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