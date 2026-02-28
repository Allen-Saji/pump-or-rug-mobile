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
        pump: "#00FF88",
        rug: "#FF3366",
        dark: {
          DEFAULT: "#0A0A0A",
          100: "#1A1A1A",
          200: "#2A2A2A",
          300: "#3A3A3A",
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
