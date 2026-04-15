import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'sm': '375px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1440px',
    },
    extend: {
      colors: {
        navy: { DEFAULT: '#1A365D', light: '#2B4C7E', dark: '#0A1A30' },
        gold: { DEFAULT: '#D4A574', light: '#E6C49F', dark: '#B08050' },
        teal: { DEFAULT: '#0D9488', light: '#14B8A6', dark: '#0F766E' }
      },
      fontFamily: {
        cairo: ['var(--font-cairo)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;