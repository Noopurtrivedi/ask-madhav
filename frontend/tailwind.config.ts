import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Every integer step 0–100, so modifiers like `border-gold/12` or
      // `text-moonlight/58` (used throughout) generate instead of being
      // silently dropped — a dropped border falls back to light gray.
      opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [String(i), String(i / 100)])),
      colors: {
        navy: {
          DEFAULT: '#0A0F2E',
          light: '#111827',
          dark: '#050A1E',
        },
        saffron: {
          DEFAULT: '#E8A620',
          light: '#F0B830',
          dark: '#C88A10',
        },
        gold: {
          DEFAULT: '#D4A017',
          light: '#E8B830',
        },
        cream: {
          DEFAULT: '#FFFCF5',
          muted: '#FBF4E6',
        },
        // Warm dark text for the light theme
        ink: {
          DEFAULT: '#3A2A18',
          light: '#6B5840',
        },

        // ── Darshan palette (the cosmic hero layer) ──────────────
        // Deep indigo & peacock blue carry the sky; gold and lotus pink are
        // the light within it. Text on the cosmos is moonlight, never pure #fff.
        cosmos: {
          DEFAULT: '#0A0E2A',
          deep: '#060919',
          violet: '#2A1A4A',
        },
        peacock: {
          DEFAULT: '#1F7A8C',
          light: '#7FD4D0',
        },
        'gold-soft': '#E8C35A',
        moonlight: '#F6F1E4',
        lotus: '#E8A0B8',
      },
      fontFamily: {
        // Wired to the next/font variables set on <html> in app/layout.tsx.
        display: ['var(--font-display)', 'Georgia', 'serif'],
        caps: ['var(--font-caps)', 'var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        sanskrit: ['var(--font-sanskrit)', 'var(--font-hindi)', 'serif'],
        hindi: ['var(--font-hindi)', 'var(--font-sanskrit)', 'serif'],
        // Legacy aliases — older markup still says font-crimson / font-inter.
        crimson: ['var(--font-display)', 'Georgia', 'serif'],
        inter: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'lotus-pulse': 'lotus-pulse 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 4s linear infinite',
      },
      keyframes: {
        'lotus-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
