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
            50: '#fef7ff',
            100: '#fdeeff',
            200: '#fcd9fe',
            300: '#fab8fc',
            400: '#f587f8',
            500: '#ed54f1',
            600: '#dd32e4',
            700: '#c225c9',
            800: '#a021a5',
            900: '#851f86',
            950: '#570a5a',
          },
          salon: {
            pink: '#ff6b9d',
            purple: '#c471ed',
            blue: '#12c2e9',
          }
        },
        fontFamily: {
          sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }