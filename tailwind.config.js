/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'daw-bg': '#0f172a',
        'daw-panel': '#1e293b',
        'daw-grid': '#334155',
        'daw-text': '#e5e7eb',
        'daw-accent': '#3b82f6',
        'daw-playhead': '#ef4444',
        'daw-loop': 'rgba(59,130,246,0.25)',
        'daw-selected': '#facc15',
        'daw-success': '#22c55e',
        'daw-warning': '#f97316',
      },
    },
  },
  plugins: [],
};