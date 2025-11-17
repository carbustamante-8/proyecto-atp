// REEMPLAZA el contenido de tu crear-ot/page.tsx
// Esto arregla el error de Vercel "useSearchParams()"
// envolviendo el formulario en <Suspense>.
import { Suspense } from 'react';
import CrearOTForm from './CrearOTForm'; // Importa tu formulario

// Este componente (la página) ahora es un "Server Component"
export default function CrearOTPage() {
  return (
    // Suspense es OBLIGATORIO porque CrearOTForm usa useSearchParams
    <Suspense fallback={<div className="p-8 font-sans">Cargando...</div>}>
      <CrearOTForm />
    </Suspense>
  );
}