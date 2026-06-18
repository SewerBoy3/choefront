/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          pink: {
            light: '#FFF0F5',
            DEFAULT: '#FFB6C1',
            dark: '#FF99AA',
          },
          blue: {
            light: '#E0F7FA',
            DEFAULT: '#AEC6CF',
            dark: '#87B0BE',
          },
          lavender: {
            light: '#F3E5F5',
            DEFAULT: '#D8BFD8',
            dark: '#C79FC7',
          },
          peach: {
            light: '#FFF5EE',
            DEFAULT: '#FFDAB9',
            dark: '#FFBC9B',
          },
          mint: {
            light: '#E8F8F5',
            DEFAULT: '#B2F7EF',
            dark: '#93E1D8',
          },
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        retro: ['"Press Start 2P"', 'monospace'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        'glass-hover': '0 12px 40px 0 rgba(31, 38, 135, 0.15)',
      },
      backdropBlur: {
        'glass': '12px',
      }
    },
  },
  plugins: [],
}
