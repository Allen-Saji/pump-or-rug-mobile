"use client";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Pump or Rug"
    >
      <text
        x="0"
        y="32"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight="700"
        fontSize="32"
        letterSpacing="2"
      >
        <tspan fill="#23F28B">PUMP</tspan>
        <tspan fill="#93A4C3"> OR </tspan>
        <tspan fill="#FF4D6D">RUG</tspan>
      </text>
    </svg>
  );
}
