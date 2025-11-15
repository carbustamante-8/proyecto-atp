// frontend/context/AuthContext.tsx
// (CÓDIGO ACTUALIZADO: El Contexto ahora maneja la redirección post-login)

'use client'; 

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
// ¡NUEVAS IMPORTACIONES!
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

export type UserProfile = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: string; 
};

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // ¡NUEVO! Hooks de Navegación
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        const userProfileRef = doc(db, "usuarios", user.uid);
        const unsubscribeProfile = onSnapshot(userProfileRef, (doc) => {
          if (doc.exists()) {
            setUserProfile({ id: doc.id, ...doc.data() } as UserProfile);
          } else {
            setUserProfile(null); 
          }
          setLoading(false);
        }, (error) => {
          console.error("Error al escuchar perfil:", error);
          setUserProfile(null);
          setLoading(false);
        });
        
        return () => unsubscribeProfile(); 
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe(); 
  }, []);

  // --- ¡NUEVO useEffect para REDIRECCIÓN INTELIGENTE! ---
  useEffect(() => {
    // 1. No hagas nada si estamos cargando
    if (loading) {
      return;
    }

    // 2. Si el usuario está cargado y está en la página de Login...
    if (user && userProfile && (pathname === '/' || pathname === '/recuperar-contrasena')) {
      toast.success(`¡Bienvenido, ${userProfile.nombre}!`);
      
      // 3. Redirígelo a su "home" correcto
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
        router.push('/'); // Fallback
      }
    }
  }, [user, userProfile, loading, pathname, router]); // Se activa cuando el login termina

  const value = {
    user,
    userProfile,
    loading,
    setUser,
    setUserProfile 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};