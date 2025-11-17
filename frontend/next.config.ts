// REEMPLAZA el contenido de tu next.config.ts
// Quitamos la línea 'tailwind: true' que causaba la advertencia.
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;