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
        'route-draw': 'route-draw 3s ease-in-out infinite',
        'pin-bounce': 'pin-bounce 2s ease-in-out infinite',
        'breathing': 'breathing 2s ease-in-out infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
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
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [
    // @ts-ignore - Optional plugin
    typeof require !== 'undefined' && require('tailwindcss-animate'),
  ].filter(Boolean),
}
export default config
