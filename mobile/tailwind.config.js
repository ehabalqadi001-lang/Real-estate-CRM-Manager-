/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#ecfdf5',
          600: '#16a34a',
          700: '#15803d',
        },
      },
    },
  },
  plugins: [],
}
