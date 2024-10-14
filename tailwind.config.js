/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}', // Adjust this according to your project structure
    './src-tauri/**/*.{rs}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
