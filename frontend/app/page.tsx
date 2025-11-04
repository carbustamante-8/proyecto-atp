// Este "use client" es MUY importante porque usamos botones
"use client";

import React, { useState } from "react";
import Image from "next/image"; // Importa el componente de Imagen

// Importa los estilos desde tu nuevo archivo CSS
import styles from "./page.module.css";

// <--- CAMBIO 1: Importa las herramientas de Firebase y el Router ---
import { auth } from "@/lib/firebase"; // (Asume que creaste lib/firebase.ts)
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Home() {
 // Estados (estos ya los tenías, están perfectos)
 const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
 const [showPassword, setShowPassword] = useState(false);

  // <--- CAMBIO 2: Inicializa el router para redirigir ---
  const router = useRouter();

  // <--- CAMBIO 3: Reemplaza tu LÓGICA FALSA por esta LÓGICA REAL ---
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Evita que la página se recargue
    setError(""); // Limpia errores anteriores

    // Intenta iniciar sesión con Firebase
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log("¡Inicio de sesión exitoso!", userCredential.user);

      // ¡Éxito! Redirige al usuario al dashboard
      // (Vi que tenías una carpeta dashboard-admin, así que apuntamos ahí)
      router.push("/dashboard-admin");

    } catch (err) {
      // Si falla (mala clave, etc.), muestra un error
      console.error("Error en el login:", err);
      setError("Error: Correo o contraseña incorrectos.");
    }
  };
  // --- FIN DE LA LÓGICA REAL ---

  // Esta función ya la tenías, está perfecta
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // --- TU HTML / JSX (No se necesita cambiar NADA aquí) ---
  return (
    <div className={styles.container}>
      {/* Lado Izquierdo - Formulario */}
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Taller Mecánico - PepsiCo</h1>
        <p className={styles.subtitle}>Por favor, ingresa tus datos</p>

                        <form onSubmit={handleLogin} className={styles.form}>
                              {/* Campo Email */}
                              <div className={styles.formField}>
                                    <label htmlFor="email" className={styles.label}>
                                          Email:
                                    </label>
                                    <input
                                          type="email"
                                          id="email"
                                          value={email}
                                          onChange={(e) => setEmail(e.target.value)}
                                          required
                                          className={styles.input}
                                    />
                              </div>

                              {/* Campo Contraseña */}
                              <div className={styles.formField}>
                                    <label htmlFor="password" className={styles.label}>
                                          Contraseña:
                                    </label>
                                    <div className={styles.passwordWrapper}>
                                          <input
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className={styles.input}
                                          />
                                          <button
                                                type="button"
                                                onClick={togglePasswordVisibility}
                                                className={styles.toggleBtn}
                                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                          >
                                                {showPassword ? "Ocultar" : "Mostrar"}
                                          </button>
                                    </div>
                              </div>

          {/* Enlace Olvidé mi contraseña */}
          <div className={styles.forgotContainer}>
            <a href="#" className={styles.link}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Mensaje de error */}
          {error && <p className={styles.error}>{error}</p>}

          {/* Botón de login */}
          <button type="submit" className={styles.submitBtn}>
            Iniciar Sesión
          </button>

          {/* Enlace de registro */}
          <p className={styles.registerText}>
            ¿No tienes una cuenta?{" "}
            <a href="#" className={styles.link}>
              Registrarse
            </a>
          </p>
        </form>
      </div>

      {/* Lado Derecho - Imagen */}
      <div className={styles.imageContainer}>
        <Image
          src="/pepsico-logo.png"
          alt="PepsiCo Logo"
          width={500}
          height={500}
          className={styles.image}
          priority
        />
      </div>
    </div>
  );
}