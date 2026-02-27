"use client";

import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="py-16 px-4 border-t border-white/[0.04]">
      <div className="max-w-content mx-auto text-center">
        <Logo className="h-5 w-auto mx-auto mb-6 opacity-40" />

        {/* Social placeholders */}
        <div className="flex justify-center gap-6 mb-8">
          {["Twitter", "Discord", "GitHub"].map((label) => (
            <span
              key={label}
              className="font-mono text-xs text-muted/40 px-4 py-2 rounded-full border border-white/[0.04]"
            >
              {label}
            </span>
          ))}
        </div>

        <p className="text-muted/60 text-sm max-w-md mx-auto">
          This is not financial advice. It&apos;s prediction gaming with
          transparent on-chain-aware rules.
        </p>

        <div className="divider-gradient my-6" />

        <p className="text-muted/30 text-xs font-mono">
          Built on Solana &middot; &copy; 2026 Pump or Rug Arena
        </p>
      </div>
    </footer>
  );
}
