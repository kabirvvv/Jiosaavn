/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14120F',
        panel: '#1E1A15',
        panel2: '#26211A',
        chassis: '#0E0C0A',
        signal: '#FF5C35',
        signal2: '#FF7A57',
        vu: '#6FE7C5',
        paper: '#F3EDE1',
        muted: '#9A9186',
        line: '#332C22'
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        body: ['"Inter"', 'sans-serif']
      },
      boxShadow: {
        deck: '0 -4px 40px rgba(0,0,0,0.55)',
        knob: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.4)'
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)"
      },
      backgroundSize: {
        grain: '3px 3px'
      }
    }
  },
  plugins: []
}
