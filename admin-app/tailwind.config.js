/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: '#0f1117',
          surface: '#181b24',
          card: '#1f2430',
          border: '#2a3142',
          primary: '#f97316',
          accent: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
};

