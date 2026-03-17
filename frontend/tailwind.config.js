/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: '#d4a550',
        brown: '#8B4513',
        red: '#e74c3c',
      },
    },
  },
  plugins: [],
}
