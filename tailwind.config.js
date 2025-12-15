/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'spin-fast': 'spin-fast 0.7s linear infinite',
        'float': 'float 20s infinite ease-in-out',
        'float-slow': 'float 30s infinite ease-in-out',
      },
      keyframes: {
        'spin-fast': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
          '25%': { transform: 'translate(20px, 30px) rotate(10deg) scale(1.1)' },
          '50%': { transform: 'translate(-10px, -20px) rotate(-5deg) scale(0.95)' },
          '75%': { transform: 'translate(10px, 15px) rotate(5deg) scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
