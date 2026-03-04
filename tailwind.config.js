/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        pump: "#32D74B",
        rug: "#FF3366",
        dark: {
          DEFAULT: "#0A0A0A",
          100: "#141414",
          200: "#1C1C1E",
          300: "#2C2C2E",
          400: "#3A3A3C",
        },
        gold: "#FFD700",
        silver: "#C0C0C0",
        bronze: "#CD7F32",
      },
      fontFamily: {
        mono: ["SpaceMono"],
      },
    },
  },
  plugins: [],
};
