// frontend/app/crear-ot/page.tsx
// (CÓDIGO ACTUALIZADO: Implementando Dynamic Import para corregir el error de Suspense)

'use client'; 
import { Suspense } from 'react'; 
import dynamic from 'next/dynamic'; 

// 1. Carga dinámica del componente Formulario, forzando la renderización solo en el cliente
// El componente CrearOTForm ahora contiene toda la lógica previamente en este archivo.
const CrearOTClientForm = dynamic(() => import('./CrearOTForm'), {
  loading: () => (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Agendar Nueva OT</h1>
        <p className="text-center text-gray-600">Cargando formulario...</p>
      </div>
    </div>
  ),
  ssr: false, // ¡Esto fuerza el renderizado solo en el cliente y resuelve el error!
});

// 2. El wrapper solo renderiza el componente cargado dinámicamente.
export default function CrearOTPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <CrearOTClientForm />
    </Suspense>
  );
}