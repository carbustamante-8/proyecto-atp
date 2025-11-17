// Este archivo es el "wrapper" de la página.
// Quitamos el layout de centrado (flex min-h-screen...)
// para que la página fluya normalmente debajo del Navbar.
import { Suspense } from 'react';
import CrearOTForm from './CrearOTForm';

export default function CrearOTPage() {
  return (
    // El padding (p-8) y el layout de la página
    // se manejan ahora dentro de CrearOTForm.tsx
    <Suspense fallback={<div className="p-8 font-sans">Cargando...</div>}>
      <CrearOTForm />
    </Suspense>
  );
}