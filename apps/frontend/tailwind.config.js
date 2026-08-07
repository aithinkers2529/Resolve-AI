/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7fa',
          100: '#e4e9f0',
          200: '#cbd5e1',
          500: '#0f172a',
          600: '#1e293b',
          700: '#334155',
        },
      },
    },
  },
  plugins: [],
}
