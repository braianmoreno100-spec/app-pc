/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        oee: {
          rojo: '#ef4444',
          naranja: '#f59e0b',
          amarillo: '#eab308',
          verde: '#22c55e',
          azul: '#3b82f6'
        }
      }
    },
  },
  plugins: [],
}

