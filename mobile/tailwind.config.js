/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        'surface-2': '#334155',
        primary: '#6366f1',
        'primary-light': '#818cf8',
        accent: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        text: '#f8fafc',
        'text-muted': '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
      },
    },
  },
  plugins: [],
};
