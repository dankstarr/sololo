import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F9F9FB', // Paper White
        foreground: '#1a1a1a',
        primary: {
          DEFAULT: '#2D5A27', // Deep Forest Green
          foreground: '#FFFFFF',
          50: '#f0f9f0',
          100: '#e0f2e0',
          200: '#bae6ba',
          300: '#7dd37d',
          400: '#38b838',
          500: '#2D5A27',
          600: '#1f3f1a',
          700: '#152a12',
          800: '#0f1f0d',
          900: '#0a1509',
        },
        secondary: {
          DEFAULT: '#E8F0E6', // Soft Sage
          foreground: '#2D5A27',
        },
        muted: {
          DEFAULT: '#64748B',
          foreground: '#1a1a1a',
        },
        accent: {
          DEFAULT: '#E8F0E6',
          foreground: '#2D5A27',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#FFFFFF',
        },
        border: '#e5e7eb',
        input: '#e5e7eb',
        ring: '#2D5A27',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1a1a1a',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem', // Modern, friendly mobile-app feel
      },
      animation: {
        'glitch': 'glitch 0.3s ease-in-out',
        'glitch-slow': 'glitch 0.5s ease-in-out infinite',
        'route-draw': 'route-draw 3s ease-in-out infinite',
        'pin-bounce': 'pin-bounce 2s ease-in-out infinite',
        'breathing': 'breathing 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.6s ease-out',
        'scale-in': 'scale-in 0.4s ease-out',
        'tilt-shake': 'tilt-shake 0.5s ease-in-out',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0) rotate(0deg)' },
          '10%': { transform: 'translate(-1px, 1px) rotate(-0.5deg)' },
          '20%': { transform: 'translate(-2px, 2px) rotate(0.5deg)' },
          '30%': { transform: 'translate(1px, -1px) rotate(-0.5deg)' },
          '40%': { transform: 'translate(-1px, -2px) rotate(0.5deg)' },
          '50%': { transform: 'translate(2px, 1px) rotate(-0.5deg)' },
          '60%': { transform: 'translate(-2px, 1px) rotate(0.5deg)' },
          '70%': { transform: 'translate(1px, 2px) rotate(-0.5deg)' },
          '80%': { transform: 'translate(-1px, -1px) rotate(0.5deg)' },
          '90%': { transform: 'translate(2px, -1px) rotate(-0.5deg)' },
        },
        'route-draw': {
          '0%': { strokeDashoffset: '100%' },
          '100%': { strokeDashoffset: '0%' },
        },
        'pin-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        breathing: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'tilt-shake': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-2deg)' },
          '75%': { transform: 'rotate(2deg)' },
        },
      },
      transformStyle: {
        'preserve-3d': 'preserve-3d',
      },
      perspective: {
        '1000': '1000px',
        '2000': '2000px',
      },
    },
  },
  plugins: [
    // @ts-ignore - Optional plugin
    typeof require !== 'undefined' && require('tailwindcss-animate'),
  ].filter(Boolean),
}
export default config
