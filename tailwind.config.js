/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      ...require('./design-system/tailwind.extend.js')
    },
  },
  plugins: [],
};
