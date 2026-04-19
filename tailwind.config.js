/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx,mdx}',
    './pages/**/*.{js,jsx,ts,tsx,mdx}',
    './components/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware palette using CSS variables
        'bg-primary':   'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-card':      'var(--bg-card)',
        'bg-elevated':  'var(--bg-elevated)',
        'bg-hover':     'var(--bg-hover)',

        // Purple accent system
        'purple-primary': 'var(--purple-600)',
        'purple-hover':   'var(--purple-500)',
        'purple-light':   'var(--purple-400)',
        'purple-muted':   '#a78bfa',
        'purple-subtle':  '#4c1d95',

        // Text
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',

        // Status / accent colors
        'accent-green':  '#10b981',
        'accent-red':    '#ef4444',
        'accent-yellow': '#f59e0b',
        'accent-blue':   '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'purple-gradient': 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
        'card-gradient':   'linear-gradient(180deg, transparent 0%, rgba(10,10,15,0.95) 100%)',
        'hero-gradient':   'linear-gradient(to right, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.6) 60%, transparent 100%)',
      },
      boxShadow: {
        'purple-glow': '0 0 30px rgba(124, 58, 237, 0.3)',
        'purple-sm':   '0 0 15px rgba(124, 58, 237, 0.2)',
        'card':        '0 4px 24px rgba(0, 0, 0, 0.5)',
        'card-hover':  '0 8px 40px rgba(124, 58, 237, 0.2)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'shimmer':    'shimmer 1.5s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'scale-in':   'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
