import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050709",
        surface: "#0A0F1C",
        surfaceElevated: "#111827",
        primary: "#F0F2F5",
        muted: "#7A8BA8",
        pump: "#23F28B",
        rug: "#FF4D6D",
        accent: "#3B82F6",
        warn: "#F59E0B",
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      maxWidth: {
        content: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
