"use client";

export function RocketIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <ellipse cx="40" cy="68" rx="8" ry="12" fill="#F59E0B" opacity="0.8" />
      <ellipse cx="40" cy="65" rx="5" ry="8" fill="#FF4D6D" opacity="0.9" />
      <path d="M30 55 Q30 20 40 10 Q50 20 50 55 Z" fill="#F0F2F5" />
      <circle cx="40" cy="32" r="6" fill="#3B82F6" />
      <circle cx="40" cy="32" r="3" fill="#050709" opacity="0.3" />
      <path d="M30 50 L22 58 L30 55Z" fill="#23F28B" />
      <path d="M50 50 L58 58 L50 55Z" fill="#23F28B" />
      <circle cx="40" cy="12" r="2" fill="#F59E0B" />
    </svg>
  );
}

export function TrophyIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <path d="M25 15 L25 40 Q25 55 40 55 Q55 55 55 40 L55 15 Z" fill="#F59E0B" />
      <path d="M25 20 Q10 20 10 32 Q10 42 25 42" stroke="#F59E0B" strokeWidth="4" fill="none" />
      <path d="M55 20 Q70 20 70 32 Q70 42 55 42" stroke="#F59E0B" strokeWidth="4" fill="none" />
      <rect x="36" y="55" width="8" height="10" fill="#F59E0B" />
      <rect x="28" y="63" width="24" height="6" rx="2" fill="#F59E0B" />
      <polygon points="40,22 43,30 51,30 45,35 47,43 40,38 33,43 35,35 29,30 37,30" fill="#050709" opacity="0.3" />
    </svg>
  );
}

export function GameController({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
      <path d="M20 25 Q20 15 35 15 L85 15 Q100 15 100 25 L105 55 Q107 70 90 70 Q80 70 75 55 L45 55 Q40 70 30 70 Q13 70 15 55 Z" fill="#0A0F1C" stroke="#3B82F6" strokeWidth="2" />
      <rect x="28" y="32" width="6" height="18" rx="1" fill="#3B82F6" />
      <rect x="22" y="38" width="18" height="6" rx="1" fill="#3B82F6" />
      <circle cx="82" cy="33" r="5" fill="#23F28B" />
      <circle cx="93" cy="41" r="5" fill="#FF4D6D" />
      <circle cx="82" cy="49" r="5" fill="#F59E0B" />
      <circle cx="71" cy="41" r="5" fill="#3B82F6" />
    </svg>
  );
}

export function SwordsIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <line x1="15" y1="65" x2="50" y2="15" stroke="#23F28B" strokeWidth="4" strokeLinecap="round" />
      <line x1="10" y1="55" x2="25" y2="60" stroke="#23F28B" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="15" r="3" fill="#F0F2F5" />
      <line x1="65" y1="65" x2="30" y2="15" stroke="#FF4D6D" strokeWidth="4" strokeLinecap="round" />
      <line x1="70" y1="55" x2="55" y2="60" stroke="#FF4D6D" strokeWidth="3" strokeLinecap="round" />
      <circle cx="30" cy="15" r="3" fill="#F0F2F5" />
      <circle cx="40" cy="40" r="12" fill="#0A0F1C" stroke="#F59E0B" strokeWidth="2" />
      <text x="40" y="45" textAnchor="middle" fill="#F59E0B" fontSize="12" fontWeight="bold" fontFamily="monospace">VS</text>
    </svg>
  );
}
