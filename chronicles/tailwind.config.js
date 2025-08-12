/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'parchment': 'var(--parchment)',
        'parchment-dark': 'var(--parchment-dark)',
        'ink': 'var(--ink)',
        'ink-light': 'var(--ink-light)',
        'gold': 'var(--gold)',
        'gold-light': 'var(--gold-light)',
        'gold-dark': 'var(--gold-dark)',
        'bronze': 'var(--bronze)',
        'bronze-light': 'var(--bronze-light)',
        'bronze-dark': 'var(--bronze-dark)',
        'burgundy': 'var(--burgundy)',
        'burgundy-light': 'var(--burgundy-light)',
        'crimson': 'var(--crimson)',
        'sage': 'var(--sage)',
        'sage-light': 'var(--sage-light)',
        'ivory': 'var(--ivory)',
      },
      fontFamily: {
        'display': ['Cinzel', 'serif'],
        'serif': ['Crimson Text', 'serif'],
        'garamond': ['Cormorant Garamond', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          'from': { 
            filter: 'drop-shadow(0 0 5px var(--glow))',
            transform: 'scale(1)' 
          },
          'to': { 
            filter: 'drop-shadow(0 0 20px var(--glow))',
            transform: 'scale(1.02)' 
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
