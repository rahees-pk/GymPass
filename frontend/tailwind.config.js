/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0B0B0B",
        surface: "#151515",
        primary: "#FF3B30",
        secondary: "#D32F2F",
        accent: "#FF6A3D",
        muted: "#A1A1AA",
        // "white" already exists in Tailwind by default (#FFFFFF)
      },
    },
  },
  plugins: [],
};
