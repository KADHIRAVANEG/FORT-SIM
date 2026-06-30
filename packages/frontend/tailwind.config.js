/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forti: {
          red: "#DA291C",
          dark: "#1A1A1A",
          sidebar: "#212934",
          panel: "#F5F6F8",
        },
      },
    },
  },
  plugins: [],
};
