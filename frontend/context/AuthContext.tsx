// frontend/context/AuthContext.tsx

'use client'; // <-- Este archivo es 100% del lado del cliente

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Importa tu conexión de auth

// 1. Define el tipo de datos que tendrá el contexto
type AuthContextType = {
  user: User | null;       // El objeto de usuario de Firebase
  loading: boolean;      // Para saber si está "Cargando..."
};

// 2. Crea el Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Crea el "Proveedor" (el componente que "envuelve")
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged es el "oyente" de Firebase
    // Se activa CADA VEZ que alguien inicia o cierra sesión
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Usuario está logueado
        setUser(user);
      } else {
        // Usuario cerró sesión
        setUser(null);
      }
      setLoading(false); // Deja de cargar
    });

    // Se limpia el "oyente" cuando el componente se desmonta
    return () => unsubscribe();
  }, []);

  // Provee el 'user' y 'loading' a todos los hijos
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Crea el "Hook" (el atajo para usar el contexto)
// Esto es lo que usaremos en las páginas
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}