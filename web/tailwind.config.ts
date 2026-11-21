import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#FFFFFF',
        'bg-surface': '#F7F7F5',
        'bg-surface-emerald': '#ECFDF5',
        'bg-surface-saffron': '#FEF3C7',
        'bg-chrome-dark': '#0A0A0A',
        'text-primary': '#0A0A0A',
        'text-secondary': '#404040',
        'text-on-dark': '#FFFFFF',
        'brand-primary': '#047857',
        'brand-primary-deep': '#065F46',
        'brand-surface': '#ECFDF5',
        'success': '#F59E0B',
        'success-text': '#B45309',
        'error': '#B91C1C',
        'error-action': '#B91C1C',
        'border-subtle': '#E5E5E5',
        'border-ledger': '#047857',
        'focus-ring': '#047857',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-xl': ['3.5rem', { lineHeight: '4rem', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-lg': ['2.5rem', { lineHeight: '3rem', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-md': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h1': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h2': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.005em', fontWeight: '600' }],
        'h3': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '500' }],
        'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em', fontWeight: '400' }],
        'numeric-ledger': ['1rem', { lineHeight: '1.5rem', fontWeight: '500' }],
        'numeric-penerima': ['1.5rem', { lineHeight: '2rem', fontWeight: '500' }],
      },
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'default': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'full': '9999px',
      },
      boxShadow: {
        'none': 'none',
        'xs': '0 1px 2px rgba(10,10,10,0.04)',
        'sm': '0 1px 3px rgba(10,10,10,0.06), 0 1px 2px rgba(10,10,10,0.04)',
        'md': '0 4px 6px rgba(10,10,10,0.07), 0 2px 4px rgba(10,10,10,0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
