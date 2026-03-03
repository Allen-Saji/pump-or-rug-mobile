"use client";

import { motion } from "framer-motion";
import { GameController, Sword, CurrencyDollar } from "@phosphor-icons/react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5 },
};

const phases = [
  {
    phase: "V1",
    title: "Prediction Core",
    icon: <GameController size={28} weight="duotone" className="text-pump" />,
    items: [
      "Hourly rounds (pump.fun)",
      "Birdeye settlement engine",
      "Leaderboard + streaks",
      "Mobile-first UI",
    ],
    status: "BUILDING NOW",
    statusColor: "text-pump bg-pump/10",
    active: true,
  },
  {
    phase: "V2",
    title: "Clans and Leagues",
    icon: <Sword size={28} weight="duotone" className="text-accent" />,
    items: [
      "Multi-platform expansion (bags.fm, Raydium)",
      "Team-based competition",
      "Weekly league brackets",
      "Shareable win cards",
    ],
    status: "PLANNED",
    statusColor: "text-accent bg-accent/10",
    active: false,
  },
  {
    phase: "V3",
    title: "Token Economy",
    icon: <CurrencyDollar size={28} weight="duotone" className="text-warn" />,
    items: [
      "On-chain prediction records",
      "Token rewards + staking",
      "DAO governance",
      "Cross-chain expansion",
    ],
    status: "VISION",
    statusColor: "text-warn bg-warn/10",
    active: false,
  },
];

export default function Roadmap() {
  return (
    <section id="roadmap" className="py-16 sm:py-20 px-4">
      <div className="max-w-content mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted/60">
            The Journey
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold mt-3">
            Roadmap
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical connector line */}
          <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-pump via-accent to-warn/30" />

          <div className="space-y-6">
            {phases.map((p, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`relative pl-16 sm:pl-20 ${!p.active ? "opacity-50" : ""}`}
              >
                {/* Timeline dot */}
                <div className={`absolute left-4 sm:left-6 top-6 w-4 h-4 rounded-full border-2 ${
                  p.active
                    ? "bg-pump border-pump"
                    : "bg-surface border-white/20"
                }`} />

                <div className="p-6 rounded-2xl bg-surfaceElevated border border-white/[0.04]">
                  <div className="flex items-center gap-3 mb-3">
                    {p.icon}
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{p.phase}</span>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${p.statusColor} font-bold tracking-wider`}>
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-xl mb-3">{p.title}</h3>

                  <ul className="space-y-1.5">
                    {p.items.map((item, j) => (
                      <li key={j} className="text-muted text-sm flex items-start gap-2">
                        <span className="text-xs mt-1 text-muted/40">›</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
