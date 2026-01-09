/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './backend/src/contexts/public/views/**/*.ejs',
    './backend/src/contexts/admin/views/**/*.ejs',
    './frontend/src/**/*.{html,js}'
  ],
  theme: {
    extend: {
      colors: {
        // Forest theme matching etnoDB
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',  // Primary color
          700: '#15803d',  // Hover color
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
      },
    },
  },
  plugins: [],
}
