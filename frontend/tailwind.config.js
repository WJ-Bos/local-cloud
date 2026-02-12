/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        primary: {
          dark: '#0F1419',
          darker: '#16181D',
          blue: '#232F3E',
          orange: '#FF9900',
          'orange-dark': '#EC7211',
          light: '#D8D9DA',
          cream: '#FFF6E0',
          gray: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#EEEEEE',
            300: '#E0E0E0',
            400: '#BDBDBD',
            500: '#9E9E9E',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            850: '#2D2D2D',
            900: '#1A1A1A',
          },
        },
      },
      boxShadow: {
        'island': '0 4px 24px rgba(0,0,0,0.6), 0 20px 64px rgba(0,0,0,0.5), 0 48px 120px rgba(0,0,0,0.35)',
        'island-sm': '0 2px 12px rgba(0,0,0,0.55), 0 8px 36px rgba(0,0,0,0.45)',
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-grid': '28px 28px',
      },
    },
  },
  plugins: [],
}
