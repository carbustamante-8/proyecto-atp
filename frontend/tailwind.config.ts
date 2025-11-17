import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Paleta de Colores Corporativa Pepsi
      colors: {
        'pepsi-blue': {
          DEFAULT: '#004B8D', // Azul principal
          'light': '#007bff',   // Azul para enlaces (tu 'pepsi-light-blue')
          'dark': '#003d73',    // Para hover
        },
        'pepsi-red': {
          DEFAULT: '#D40026', // Rojo para peligro/logout
          'dark': '#a9001e',
        },
        'neutral': {
          '50': '#f8f9fa',   // Fondo de página (tu 'background')
          '100': '#f1f3f5',  // Hover de elementos
          '700': '#495057',  // Texto secundario
          '900': '#212529',  // Texto principal
        },
      },
      // Tipografía Profesional (usaremos la que ya tenías)
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      // Sombra sutil para las tarjetas
      boxShadow: {
        'card': '0 4px 12px 0 rgba(0,0,0,0.05)',
        'card-hover': '0 6px 16px 0 rgba(0,0,0,0.08)',
      },
      // Animación sutil
      transitionProperty: {
        'transform-shadow': 'transform, box-shadow',
      },
    },
  },
  plugins: [],
};
export default config;