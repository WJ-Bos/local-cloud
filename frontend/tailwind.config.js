/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
    },
  },
  plugins: [],
}
