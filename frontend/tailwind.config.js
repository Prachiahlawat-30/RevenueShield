/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          'surface-subtle': 'var(--color-surface-subtle)',
          'surface-elevated': 'var(--color-surface-elevated)',
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          border: 'var(--color-border)',
          'border-subtle': 'var(--color-border-subtle)',
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
        },
        brand: {
          50: '#F3EEFF',
          100: '#E9DEFF',
          200: '#D5BEFF',
          300: '#B892FF',
          400: '#8E52F0',
          500: '#6822CC', // Primary Brand #6822CC
          600: '#581DB0',
          700: '#4B1A99', // Primary Dark #4B1A99
          800: '#3D157D',
          900: '#301161',
          950: '#1C0A3B',
          light: '#F3EEFF',
          dark: '#4B1A99',
        },
        accent: {
          blue: '#2B6FFF',
          'blue-subtle': '#EFF4FF',
        },
        slate: {
          850: '#151f32',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'fintech-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'fintech-md': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'fintech-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
        'fintech-glow': '0 0 20px -5px rgba(104, 34, 204, 0.2)',
      },
      borderRadius: {
        'fintech-sm': '6px',
        'fintech-md': '8px',
        'fintech-lg': '14px',
        'fintech-xl': '16px',
        'fintech-card': '14px',
      },
    },
  },
  plugins: [],
}
