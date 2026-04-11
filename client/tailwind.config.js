/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0B6E4F',
          secondary: '#E8F5E9',
          accent: '#114B5F',
        },
      },
    },
  },
  plugins: [],
}
