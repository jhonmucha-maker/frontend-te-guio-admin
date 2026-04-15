/** @type {import('tailwindcss').Config} */

function withAlpha(variable) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variable}) / ${opacityValue})`;
    }
    return `rgb(var(${variable}))`;
  };
}

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#312c85',
          light: '#4a44a8',
          dark: '#1f1b5c',
          50: '#EEEDFC',
          100: '#DDDAF9',
          200: '#BBB5F3',
          300: '#9990ED',
          400: '#776BE7',
          500: '#312c85',
          600: '#282370',
          700: '#1f1b5c',
          800: '#161247',
          900: '#0D0A33',
        },
        secondary: {
          DEFAULT: '#FF6B6B',
          light: '#FF8888',
          dark: '#E64545',
          50: '#FFF0F0',
          100: '#FFE1E1',
          200: '#FFC3C3',
          300: '#FFA5A5',
          400: '#FF8888',
          500: '#FF6B6B',
          600: '#E64545',
          700: '#CC3333',
          800: '#B32222',
          900: '#991111',
        },
        accent: {
          DEFAULT: '#4ECDC4',
          light: '#6FE0D8',
          dark: '#3AB5AD',
          50: '#E6FAF8',
          100: '#CCF5F1',
          200: '#99EBE3',
          300: '#6FE0D8',
          400: '#4ECDC4',
          500: '#3AB5AD',
          600: '#2E9A93',
          700: '#237F79',
          800: '#18645F',
          900: '#0D4945',
        },
        success: {
          DEFAULT: '#4CAF50',
          light: '#81C784',
          dark: '#388E3C',
          50: '#E8F5E9',
          100: '#C8E6C9',
          500: '#4CAF50',
          600: '#388E3C',
        },
        error: {
          DEFAULT: '#F44336',
          light: '#E57373',
          dark: '#D32F2F',
          50: '#FFEBEE',
          100: '#FFCDD2',
          500: '#F44336',
          600: '#D32F2F',
        },
        warning: {
          DEFAULT: '#FF9800',
          light: '#FFB74D',
          dark: '#F57C00',
          50: '#FFF3E0',
          100: '#FFE0B2',
          500: '#FF9800',
          600: '#F57C00',
        },
        info: {
          DEFAULT: '#2196F3',
          light: '#64B5F6',
          dark: '#1976D2',
          50: '#E3F2FD',
          100: '#BBDEFB',
          500: '#2196F3',
          600: '#1976D2',
        },
        neutral: {
          50: withAlpha('--neutral-50'),
          100: withAlpha('--neutral-100'),
          200: withAlpha('--neutral-200'),
          300: withAlpha('--neutral-300'),
          400: withAlpha('--neutral-400'),
          500: withAlpha('--neutral-500'),
          600: withAlpha('--neutral-600'),
          700: withAlpha('--neutral-700'),
          800: withAlpha('--neutral-800'),
          900: withAlpha('--neutral-900'),
        },
        gray: {
          50: withAlpha('--gray-50'),
          100: withAlpha('--gray-100'),
          200: withAlpha('--gray-200'),
          300: withAlpha('--gray-300'),
          400: withAlpha('--gray-400'),
          500: withAlpha('--gray-500'),
          600: withAlpha('--gray-600'),
          700: withAlpha('--gray-700'),
          800: withAlpha('--gray-800'),
          900: withAlpha('--gray-900'),
        },
        surface: {
          DEFAULT: withAlpha('--surface'),
          alt: withAlpha('--surface-alt'),
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
        'dropdown': '0 4px 16px rgba(0,0,0,0.1)',
        'modal': '0 8px 24px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'input': '8px',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
