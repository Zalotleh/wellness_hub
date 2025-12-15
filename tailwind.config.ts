import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        angiogenesis: {
          light: '#fee2e2',
          DEFAULT: '#ef4444',
          dark: '#991b1b',
        },
        regeneration: {
          light: '#dcfce7',
          DEFAULT: '#22c55e',
          dark: '#15803d',
        },
        microbiome: {
          light: '#f3e8ff',
          DEFAULT: '#a855f7',
          dark: '#6b21a8',
        },
        dna: {
          light: '#dbeafe',
          DEFAULT: '#3b82f6',
          dark: '#1e40af',
        },
        immunity: {
          light: '#fef3c7',
          DEFAULT: '#eab308',
          dark: '#854d0e',
        },
      },
    },
  },
  plugins: [],
};

export default config;