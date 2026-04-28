/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F7F7F5',
        forest: '#1A3C2B',
        grid: '#3A3A38',
        coral: '#FF8C69',
        mint: '#9EFFBF',
        gold: '#F4D35E',
      },
      fontFamily: {
        sans: ['"General Sans"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '2px',
      },
      borderColor: {
        DEFAULT: '#3A3A38', // grid color
      }
    },
  },
  plugins: [],
}
