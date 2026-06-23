/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Deep Navy — brand / primary text / headers
        navy: {
          50: '#f2f4f8',
          100: '#e2e7f0',
          200: '#c5cee0',
          300: '#9caac9',
          400: '#6c80ab',
          500: '#4a5e8c',
          600: '#384a72',
          700: '#2b3a5c',
          800: '#1c2942',
          900: '#0f1e3d',
          950: '#0a1429',
        },
        // Professional Blue — primary actions / links / focus
        accent: {
          50: '#eff5ff',
          100: '#dbe7fe',
          200: '#bfd3fe',
          300: '#93b4fd',
          400: '#608cfa',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3270',
        },
        // Semantic
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#059669',
          600: '#047857',
          700: '#065f46',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
        },
        // Neutral surface scale (light gray bg, white cards)
        surface: {
          base: '#f7f8fa',
          card: '#ffffff',
          sunken: '#eef1f6',
          border: '#e5e8ee',
          'border-strong': '#d4d9e3',
        },
        ink: {
          900: '#0f1e3d', // primary text (navy)
          700: '#334155',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
        },
        // Per-agent accents (subtle, used in agent pipeline)
        agent: {
          access: '#0891b2',     // cyan — data retrieval
          connection: '#7c3aed', // violet — reasoning
          summary: '#2563eb',    // blue — synthesis
        },
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(15 30 61 / 0.04)',
        sm: '0 1px 3px 0 rgb(15 30 61 / 0.06), 0 1px 2px -1px rgb(15 30 61 / 0.04)',
        md: '0 4px 12px -2px rgb(15 30 61 / 0.08), 0 2px 6px -2px rgb(15 30 61 / 0.05)',
        lg: '0 12px 28px -6px rgb(15 30 61 / 0.12), 0 4px 10px -4px rgb(15 30 61 / 0.06)',
        'focus-accent': '0 0 0 3px rgb(37 99 235 / 0.18)',
      },
      borderRadius: {
        lg: '10px',
        md: '8px',
        sm: '6px',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      spacing: {
        '4.5': '1.125rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        'pulse-ring': 'pulseRing 1.8s ease-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgb(37 99 235 / 0.35)' },
          '70%': { boxShadow: '0 0 0 8px rgb(37 99 235 / 0)' },
          '100%': { boxShadow: '0 0 0 0 rgb(37 99 235 / 0)' },
        },
      },
    },
  },
  plugins: [],
}
