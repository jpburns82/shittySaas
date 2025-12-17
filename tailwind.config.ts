import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bg-primary': '#f5f5f0',
        'bg-secondary': '#ffffff',
        'bg-accent': '#fffde7',
        'bg-dark': '#1a1a1a',

        // Borders
        'border-light': '#d0d0c8',
        'border-medium': '#999999',
        'border-dark': '#333333',

        // Text
        'text-primary': '#1a1a1a',
        'text-secondary': '#555555',
        'text-muted': '#888888',

        // Links
        'link': '#0000ee',
        'link-visited': '#551a8b',
        'link-hover': '#0000cc',

        // Accents
        'accent-green': '#008000',
        'accent-red': '#cc0000',
        'accent-yellow': '#ffcc00',
        'accent-blue': '#0066cc',

        // Buttons
        'btn-bg': '#e0e0e0',
        'btn-highlight': '#ffffff',
        'btn-shadow': '#808080',
        'btn-dark-shadow': '#404040',
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
