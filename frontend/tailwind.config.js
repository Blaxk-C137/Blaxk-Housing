/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        sand: '#F3EDE4',
        ink: '#1C1917',
        stone: { DEFAULT: '#78716C', dark: '#57534E' },
        line: '#EDE7DF',
        brand: { DEFAULT: '#B04E33', dark: '#9A4430', tint: '#F6E8E2' },
        sage: { DEFAULT: '#5F7A61', dark: '#4A614C' },
        amber: { DEFAULT: '#D97706', dark: '#92400E' },
        espresso: '#292524',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        hero: '24px',
      },
      boxShadow: {
        warm: '0 1px 2px rgba(28,25,23,0.05), 0 4px 16px rgba(28,25,23,0.06)',
        'warm-lg': '0 2px 4px rgba(28,25,23,0.06), 0 12px 32px rgba(28,25,23,0.10)',
      },
    },
  },
  plugins: [],
}
