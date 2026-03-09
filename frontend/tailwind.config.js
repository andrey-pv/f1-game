/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        f1: {
          red: '#E8001C',
          dark: '#1A1A2E',
          mid: '#16213E',
          accent: '#0F3460',
          gold: '#FFD700',
          white: '#FFFFFF',
          muted: '#94A3B8',
        },
      },
      fontFamily: {
        heading: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'count-up': 'countUp 1s ease-out forwards',
      },
    },
  },
  plugins: [],
}
