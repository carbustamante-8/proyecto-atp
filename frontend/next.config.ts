// frontend/next.config.ts

/** @type {import('next').NextConfig} */
const nextConfig = {
  // (La línea 'tailwind: true,' se elimina)

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