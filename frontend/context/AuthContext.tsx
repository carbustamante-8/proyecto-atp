// frontend/context/AuthContext.tsx
// (CÓDIGO CORREGIDO: Añadido 'setUserProfile' al context)

'use client'; 

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export type UserProfile = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: string; 
};

// --- ¡TIPO CORREGIDO! ---
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void; // <-- ¡AÑADIDO!
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        // Escucha cambios en el perfil en tiempo real
        const userProfileRef = doc(db, "usuarios", user.uid);
        const unsubscribeProfile = onSnapshot(userProfileRef, (doc) => {
          if (doc.exists()) {
            setUserProfile({ id: doc.id, ...doc.data() } as UserProfile);
          } else {
            setUserProfile(null); // Perfil no encontrado
          }
          setLoading(false);
        }, (error) => {
          console.error("Error al escuchar perfil:", error);
          setUserProfile(null);
          setLoading(false);
        });
        
        return () => unsubscribeProfile(); // Limpia el listener de perfil
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Limpia el listener de auth
  }, []);

  // --- ¡VALOR CORREGIDO! ---
  const value = {
    user,
    userProfile,
    loading,
    setUser,
    setUserProfile // <-- ¡AÑADIDO!
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