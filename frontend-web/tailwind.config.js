/** @type {import('tailwindcss').Config} */
const winePalette = {
  50: '#fbf4f5',
  100: '#f6e5e8',
  200: '#eccfd4',
  300: '#dbaab3',
  400: '#851324',
  500: '#9b1124',
  600: '#971627',
  700: '#9e0d23',
  800: '#9e1429',
  900: '#9b1c2f',
  950: '#8a0e21',
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ...winePalette,
          dark: '#0c0c0e',
          card: '#141417',
          surface: '#1b1b20',
        },
        wine: winePalette,
        orange: winePalette,
      },
    },
  },
  plugins: [],
};
