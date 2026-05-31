/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Tajawal', 'sans-serif'],
        sans: ['Tajawal', 'sans-serif'],
      },
      colors: {
        trust: {
          50:  '#EBF5FB',
          100: '#D6EAF8',
          200: '#AED6F1',
          300: '#85C1E9',
          400: '#5DADE2',
          500: '#2E86C1',
          600: '#1B6FA8',
          700: '#1B4F72',
          800: '#154360',
          900: '#0D2B42',
        },
        success: {
          50:  '#EAFAF1',
          500: '#27AE60',
          600: '#1E8449',
        },
        warning: {
          50:  '#FEF9E7',
          500: '#F39C12',
          600: '#D68910',
        },
        accent: {
          50:  '#FDF2E9',
          500: '#E67E22',
          600: '#CA6F1E',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      boxShadow: {
        'card': '0 2px 12px rgba(27, 79, 114, 0.08)',
        'card-hover': '0 6px 24px rgba(27, 79, 114, 0.16)',
        'sidebar': '-2px 0 16px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
