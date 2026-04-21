import type { Config } from 'tailwindcss'
import rtl from 'tailwindcss-rtl'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  plugins: [rtl],
}

export default config
