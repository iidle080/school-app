/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand / primary (blue)
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a',
          light: '#60a5fa', DEFAULT: '#3b82f6', dark: '#2563eb',
        },
        // Ink (text colors for dark theme)
        ink: {
          DEFAULT: '#e6edf3',
          soft: '#a0b3c6',
          muted: '#5c7a9a',
        },
        // Surface (dark backgrounds)
        surface: {
          DEFAULT: '#0d1117',
          raised: '#131929',
          overlay: '#1a2236',
          border: '#1e2d45',
          muted: '#253352',
        },
        brand: {
          DEFAULT: '#3b82f6', dark: '#2563eb', light: '#60a5fa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
