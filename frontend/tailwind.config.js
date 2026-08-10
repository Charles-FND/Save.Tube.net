/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        yt: {
          red: '#FF0000',
          'red-dark': '#CC0000',
          'red-glow': '#FF000033',
        },
        dark: {
          950: '#060608',
          900: '#0d0d0f',
          800: '#141416',
          700: '#1c1c1f',
          600: '#232326',
          500: '#2a2a2e',
          400: '#3a3a3f',
          300: '#52525a',
        },
        glass: {
          white: 'rgba(255,255,255,0.05)',
          'white-10': 'rgba(255,255,255,0.10)',
          'white-15': 'rgba(255,255,255,0.15)',
          border: 'rgba(255,255,255,0.08)',
          'border-strong': 'rgba(255,255,255,0.15)',
        },
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,0,0,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(255,0,0,0.08) 0%, transparent 60%), linear-gradient(180deg, #060608 0%, #0d0d0f 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
        'red-gradient': 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
        'red-glow-gradient': 'linear-gradient(135deg, #FF3333 0%, #FF0000 50%, #CC0000 100%)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-hover': '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)',
        'red-glow': '0 0 24px rgba(255,0,0,0.4), 0 0 48px rgba(255,0,0,0.15)',
        'red-glow-sm': '0 0 12px rgba(255,0,0,0.35)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,0,0,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255,0,0,0.6), 0 0 60px rgba(255,0,0,0.2)' },
        },
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '60px',
      },
    },
  },
  plugins: [],
}
