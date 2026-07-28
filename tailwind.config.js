/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3b82f6',
          dark:    '#2563eb',
          light:   '#60a5fa',
        },
        surface: {
          DEFAULT: '#0d1117',
          raised:  '#131929',
          overlay: '#1a2236',
          border:  '#1e2d45',
          muted:   '#253352',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
