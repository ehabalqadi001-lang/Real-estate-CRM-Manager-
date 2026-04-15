import type { Config } from "tailwindcss";

const config: Config = {
  // هذا السطر يضمن أن محرك التصميم يمسح مجلد الإدارة (admin) وكل الشاشات
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // تفعيل الثيمات (Light / Dark)
  theme: {
    // تحديد الشاشات (Breakpoints) كما وردت في الدستور
    screens: {
      'sm': '375px',   // Mobile
      'md': '768px',   // Tablet
      'xl': '1440px',  // Desktop
    },
    extend: {
      // لوحة الألوان المعتمدة (Palette)
      colors: {
        navy: {
          DEFAULT: '#1A365D',
          light: '#2B4C7E',
          dark: '#0A1A30'
        },
        gold: {
          DEFAULT: '#D4A574',
          light: '#E6C49F',
          dark: '#B08050'
        },
        teal: {
          DEFAULT: '#0D9488',
          light: '#14B8A6',
          dark: '#0F766E'
        }
      },
      // الخطوط المعتمدة (Typography)
      fontFamily: {
        cairo: ['var(--font-cairo)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      // نظام المسافات المحكم (4px grid)
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
      }
    },
  },
  plugins: [],
};

export default config;