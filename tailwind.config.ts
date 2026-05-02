import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '375px',   // small phones
        // sm: 640   (default — tablets portrait)
        // md: 768   (default — tablets landscape)
        // lg: 1024  (default — laptops)
        // xl: 1280  (default — desktops)
        // 2xl: 1536 (default — large screens)
      },
      spacing: {
        // safe-area padding for iPhone notch / Android nav
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-t': 'env(safe-area-inset-top)',
      },
    },
  },
  plugins: [],
}

export default config
