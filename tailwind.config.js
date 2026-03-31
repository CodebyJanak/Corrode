/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ember:  { DEFAULT: '#c94a0a', bright: '#e8620c', glow: '#ff7a2a', deep: '#7a2a08' },
        oxide:  { DEFAULT: '#3d1215', brown: '#2a1008' },
        void:   { DEFAULT: '#0d0608', warm: '#130a0b', 200: '#1c0f10', 300: '#261518', 400: '#341c1f', 500: '#442428' },
        rust:   { mid: '#a63a10', deep: '#7a2a08' },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        sans:    ['Rajdhani', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'ember-pulse': 'emberPulse 3s ease-in-out infinite',
        'gear-spin':   'gearSpin 20s linear infinite',
        'fade-up':     'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'crackle':     'crackle 2s ease-in-out infinite',
        'shimmer':     'shimmer 1.2s linear infinite',
      },
    },
  },
  plugins: [],
}
