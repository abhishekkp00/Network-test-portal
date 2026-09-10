/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        bg: {
          primary: '#0a0d0b',
          secondary: '#101411',
          panel: '#141a16',
          header: '#1a221d',
          input: '#0e120f',
        },
        border: {
          technical: '#27342a',
          bright: '#394d3e',
        },
        phosphor: {
          green: '#00ff66',
        },
        amber: '#ffb000',
        warning: '#eab308',
        danger: '#ff3333',
        info: '#00bfff',
      },
    },
  },
  plugins: [],
}
