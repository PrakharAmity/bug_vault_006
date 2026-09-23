/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        card: '#1E293B',
        cardBorder: '#334155',
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8'
        },
        danger: {
          DEFAULT: '#EF4444',
          hover: '#DC2626'
        },
        success: {
          DEFAULT: '#22C55E',
          hover: '#16A34A'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
