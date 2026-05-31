/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        brand: {
          bg: {
            dark: '#FAF8F3',
            card: '#FFFFFF',
            slate: '#F3EFE6'
          },
          border: 'rgba(140, 29, 29, 0.08)',
          cyan: {
            DEFAULT: '#8C1D1D',
            light: '#B03A2E',
            dark: '#601010',
            glow: 'rgba(140, 29, 29, 0.08)'
          },
          blue: {
            DEFAULT: '#1B365D',
            light: '#2E4E80',
            dark: '#0E1F3D',
            deep: '#FCFBF9'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'scanner-laser': 'laser 3s infinite linear',
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        laser: {
          '0%, 100%': { top: '0%', opacity: 0.3 },
          '50%': { top: '100%', opacity: 1 },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.03)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
