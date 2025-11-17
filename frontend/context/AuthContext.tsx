// frontend/context/AuthContext.tsx
"use client"; // <--- ¡SOLUCIÓN! Indica que este archivo usa hooks de React

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { app } from '@/lib/firebase'; // Asegúrate que esta ruta sea correcta

const auth = getAuth(app);
const db = getFirestore(app);

// --- TIPOS ---
type UserProfile = {
  id: string;
  nombre: string;
  rol: string;
  // Añade otros campos que uses del perfil
};

// 1. Definición de la Interfaz del Contexto
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Listener de Auth
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Listener de Firestore para obtener el perfil/rol
  useEffect(() => {
    let unsubscribeFirestore: () => void = () => {};
    if (user) {
      setLoading(true);
      const userDocRef = doc(db, 'usuarios', user.uid);
      unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          // Nota: Asegúrate que los campos coincidan con tu base de datos
          setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error al obtener perfil de usuario:", error);
        setLoading(false);
      });
    } else {
      setUserProfile(null);
      setLoading(false);
    }
    return () => unsubscribeFirestore();
  }, [user]);

  // Implementación de la función login
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    userProfile,
    loading,
    login, 
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};