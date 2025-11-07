// frontend/next.config.ts

/** @type {import('next').NextConfig} */
const nextConfig = {

  // (Aquí puede haber otras configuraciones que ya tenías, como 'experimental')

  // --- ¡AÑADE ESTA SECCIÓN COMPLETA! ---
  images: {
    remotePatterns: [
      {
        // Autoriza todas las imágenes de Vercel Blob
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // --- FIN DE LA SECCIÓN ---

};

export default nextConfig;