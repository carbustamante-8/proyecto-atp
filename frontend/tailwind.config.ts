import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: { /* ... */ },
      colors: {
        'pepsi-blue': 'var(--color-pepsi-blue)',
        'pepsi-red': 'var(--color-pepsi-red)',
        'pepsi-light-blue': 'var(--color-pepsi-light-blue)',
        'white': 'var(--color-white)',
        'background': 'var(--color-background)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
      },
    },
  },
  plugins: [],
};
export default config;