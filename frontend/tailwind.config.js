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
          'surface-hover': 'var(--color-surface-hover)',
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          border: 'var(--color-border)',
          'border-subtle': 'var(--color-border-subtle)',
          accent: 'var(--color-accent)',
          'accent-subtle': 'var(--color-accent-subtle)',
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          danger: 'var(--color-danger)',
        },
        brand: {
          50: 'var(--color-accent-subtle)',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: 'var(--color-accent)',
          600: '#4338CA',
          700: '#3730A3',
          800: '#312E81',
          900: '#1E1B4B',
          950: '#0F172A',
        },
        slate: {
          850: 'oklch(0.24 0.008 223.9)',
          900: 'oklch(0.218 0.008 223.9)',
          950: 'oklch(0.18 0.008 223.9)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'fintech-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'fintech-md': '0 4px 12px 0 rgba(0, 0, 0, 0.04)',
        'fintech-lg': '0 12px 28px -4px rgba(0, 0, 0, 0.06)',
        'glass-1': '0 1px 3px 0 rgba(0, 0, 0, 0.02)',
        'glass-2': '0 4px 16px -2px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'glass-3': '0 16px 40px -8px rgba(0, 0, 0, 0.12), 0 24px 64px -12px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'fintech-sm': '6px',
        'fintech-md': '10px',
        'fintech-lg': '16px',
        'fintech-xl': '20px',
        'fintech-card': '18px',
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '18px',
        'glass-deep': '24px',
      },
      transitionTimingFunction: {
        'fintech': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
