/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#EDEAE1',
        paperDark: '#E4DFD3',
        paperLine: '#C9C4B4',
        ink: '#1F2421',
        inkMuted: '#4F5752',
        mamiferos: '#7A4632',
        aves: '#2F6690',
        reptiles: '#4C6B3F',
        peces: '#1F6E77',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}