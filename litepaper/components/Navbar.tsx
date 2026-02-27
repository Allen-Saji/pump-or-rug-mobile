"use client";

import { useState, useEffect } from "react";
import Logo from "./Logo";

const sections = [
  { id: "how-it-works", label: "How It Works" },
  { id: "settlement", label: "Rules" },
  { id: "anti-manip", label: "Trust" },
  { id: "why-it-sticks", label: "Why Play" },
  { id: "roadmap", label: "Roadmap" },
];

export default function Navbar() {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const offsets = sections.map(({ id }) => {
        const el = document.getElementById(id);
        return { id, top: el?.getBoundingClientRect().top ?? Infinity };
      });

      const current = offsets.find((s) => s.top > -100 && s.top < 300);
      if (current) setActive(current.id);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bg/90 backdrop-blur-md border-b border-white/[0.04]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-content mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <a href="#hero">
          <Logo className="h-5 w-auto" />
        </a>

        <div className="hidden md:flex items-center gap-6">
          {sections.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`text-sm font-medium transition-colors ${
                active === id
                  ? "text-pump"
                  : "text-muted hover:text-primary"
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
