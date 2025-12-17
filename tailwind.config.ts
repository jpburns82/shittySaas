import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // UndeadList Dark Theme — Tokyo Underground
        'bg-crypt': '#0d0d0d',       // Page background (near black)
        'bg-grave': '#1a1a1a',       // Card backgrounds
        'bg-tombstone': '#2a2a2a',   // Elevated surfaces
        'text-bone': '#e8e8e8',      // Primary text
        'text-dust': '#888888',      // Secondary/muted text
        'accent-reanimate': '#39ff14', // Neon green (primary action, upvotes)
        'accent-bury': '#ff2d6a',      // Neon pink (destructive, downvotes)
        'accent-electric': '#00d4ff',  // Cyan (links, highlights)
        'border-crypt': '#333333',     // Borders

        // Backgrounds (mapped to dark theme)
        'bg-primary': '#0d0d0d',
        'bg-secondary': '#1a1a1a',
        'bg-accent': '#2a2a2a',
        'bg-dark': '#0d0d0d',

        // Borders
        'border-light': '#333333',
        'border-medium': '#444444',
        'border-dark': '#555555',

        // Text
        'text-primary': '#e8e8e8',
        'text-secondary': '#b0b0b0',
        'text-muted': '#888888',

        // Links
        'link': '#00d4ff',
        'link-visited': '#00a8cc',
        'link-hover': '#39ff14',

        // Accents
        'accent-green': '#39ff14',
        'accent-red': '#ff2d6a',
        'accent-yellow': '#ffcc00',
        'accent-blue': '#00d4ff',

        // Buttons (dark theme)
        'btn-bg': '#2a2a2a',
        'btn-highlight': '#3a3a3a',
        'btn-shadow': '#1a1a1a',
        'btn-dark-shadow': '#0d0d0d',
      },
      fontFamily: {
        'body': ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        'mono': ['IBM Plex Mono', 'Consolas', 'Courier New', 'monospace'],
        'display': ['VT323', 'IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.8125rem',
        'base': '0.9375rem',
        'lg': '1.125rem',
        'xl': '1.5rem',
        '2xl': '2rem',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
      },
      borderWidth: {
        '3': '3px',
      },
      maxWidth: {
        'container': '1200px',
        'narrow': '800px',
      },
    },
  },
  plugins: [],
}

export default config
