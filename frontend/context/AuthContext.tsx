// frontend/context/AuthContext.tsx

'use client'; // <-- Este archivo es 100% del lado del cliente

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; // <-- 1. IMPORTA 'db' (de Firestore)
import { doc, getDoc } from 'firebase/firestore'; // <-- 2. IMPORTA las funciones de Firestore

// 3. Define el "tipo" de perfil que guardamos en Firestore
// (Esto debe coincidir con los datos que creas en el formulario)
export type UserProfile = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
};

// 4. Define el tipo de datos que tendrá el contexto
export type AuthContextType = {
  user: User | null;           // El objeto de usuario de Firebase Auth (con el UID)
  userProfile: UserProfile | null; // El objeto de usuario de Firestore (con el ROL)
  loading: boolean;          // Para saber si está "Cargando..."
};

// 5. Crea el Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 6. Crea el "Proveedor" (el componente que "envuelve")
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // <-- NUEVO ESTADO
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged ahora es asíncrono
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      
      if (user) {
        // --- Usuario está logueado ---
        setUser(user);
        
        // ¡MAGIA! Busca el perfil en Firestore usando el UID del login
        const docRef = doc(db, 'usuarios', user.uid); // Busca en la colección 'usuarios'
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          // Si encontramos el documento...
          console.log("AuthContext: Perfil de usuario encontrado:", docSnap.data());
          // Guarda el perfil completo (con nombre, email, ROL, etc.)
          setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          // El usuario existe en Auth, pero NO en Firestore
          console.warn(`¡Alerta! El usuario ${user.uid} existe en Auth pero no tiene perfil en Firestore.`);
          setUserProfile(null);
        }
        
      } else {
        // --- Usuario cerró sesión ---
        setUser(null);
        setUserProfile(null);
      }
      
      setLoading(false); // Deja de cargar
    });

    // Se limpia el "oyente" cuando el componente se desmonta
    return () => unsubscribe();
  }, []);

  // 7. Provee el 'user', el 'userProfile' y 'loading' a todos los hijos
  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// 8. Crea el "Hook" (el atajo para usar el contexto)
// (Este hook no cambia, pero ahora devuelve más datos)
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}