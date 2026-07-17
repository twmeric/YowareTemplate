/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pine: {
          50: "#f2f7f4",
          100: "#dcebe2",
          200: "#bcd6c8",
          300: "#92b9a6",
          400: "#679a82",
          500: "#487e67",
          600: "#366451",
          700: "#2c5143",
          800: "#254137",
          900: "#1f362e",
          950: "#101e19",
        },
        rice: {
          50: "#faf8f3",
          100: "#f3eee1",
          200: "#e6dcc3",
          300: "#d5c49c",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', "serif"],
        sans: ['"Noto Sans TC"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
