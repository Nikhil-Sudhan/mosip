/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecf5ff',
          100: '#d6e9ff',
          200: '#aed4ff',
          300: '#7fbaff',
          400: '#4d9dff',
          500: '#1f7eff',
          600: '#1060db',
          700: '#0b47b0',
          800: '#073082',
          900: '#041e5c',
        },
        success: '#1abc9c',
        warning: '#f1c40f',
        danger: '#e74c3c',
      },
    },
  },
  plugins: [],
};

