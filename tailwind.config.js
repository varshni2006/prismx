/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b0b8c8',
          400: '#8591a8',
          500: '#67738d',
          600: '#525c73',
          700: '#434b5e',
          800: '#3a4050',
          900: '#1f2330',
          950: '#13161f',
        },
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcd9ff',
          300: '#8ec1ff',
          400: '#599dff',
          500: '#337bff',
          600: '#1c5cf5',
          700: '#1547e1',
          800: '#183bb6',
          900: '#1a378f',
          950: '#15235a',
        },
        accent: {
          50: '#f0fdf9',
          100: '#d9fbe9',
          200: '#b4f5d6',
          300: '#79eabc',
          400: '#3dd29b',
          500: '#16b97f',
          600: '#0a9866',
          700: '#097853',
          800: '#0c5e44',
          900: '#0c4d3a',
          950: '#042b1f',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)',
        ring: '0 0 0 1px rgba(16,24,40,0.06), 0 8px 24px rgba(16,24,40,0.08)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.25s ease-out both',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
