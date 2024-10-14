/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}', // Adjust this according to your project structure
    './src-tauri/**/*.{rs}',
  ],
  theme: {
    extend: {
      colors: {
        retrowave: {
          bg: '#0a0a0a',
          primary: '#ff00ff',  // Neon pink
          secondary: '#00ffff', // Cyan
          accent: '#ff9900',   // Orange
          text: '#ffffff',     // White
          'text-muted': '#b3b3b3', // Light gray
        },
      },
    },
  },
  plugins: [],
}
