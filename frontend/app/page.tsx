// Este "use client" es MUY importante porque usamos botones
"use client";

import React, { useState } from "react";
import Image from "next/image"; // Importa el componente de Imagen

// Importa los estilos desde tu nuevo archivo CSS
import styles from "./page.module.css";

export default function Home() {
  // Estados (solo para el formulario visual)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // --- LÓGICA DE LOGIN (FALSA) ---
  // Esta función solo muestra una alerta. NO se conecta a Firebase.
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Evita que la página se recargue
    setError("Función de login aún no conectada a Firebase."); // Muestra un error temporal
  };
  // --- FIN DE LA LÓGICA FALSA ---

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // --- HTML / JSX ---
  return (
    <div className={styles.container}>
      {/* Lado Izquierdo - Formulario */}
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Taller Mecánico - PepsiCo</h1>
        <p className={styles.subtitle}>Por favor, ingresa tus datos</p>

        <form onSubmit={handleLogin} className={styles.form}>
          {/* Campo Email */}
          <div>
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
          <div className={styles.passwordWrapper}>
            <label htmlFor="password" className={styles.label}>
              Contraseña:
            </label>
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
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
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