// app/crear-ot/page.tsx
// (Este es el nuevo contenido de la página)

import { Suspense } from 'react';
import CrearOTForm from './CrearOTForm'; // Importa el formulario que acabamos de mover

// Componente de "Cargando..." simple
function LoadingFallback() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      Cargando formulario...
    </div>
  );
}

export default function CrearOTPageWrapper() {
  return (
    // ¡AQUÍ ESTÁ LA SOLUCIÓN!
    // Envuelve el componente que usa useSearchParams en <Suspense>
    <Suspense fallback={<LoadingFallback />}>
      <CrearOTForm />
    </Suspense>
  );
}