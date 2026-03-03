"use client";

import { motion } from "framer-motion";
import { Warning, Skull, Rocket, Question, Info } from "@phosphor-icons/react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5 },
};

const rules = [
  {
    label: "VOID",
    icon: <Warning size={24} weight="fill" className="text-warn" />,
    color: "text-warn",
    stripe: "rule-stripe-warn",
    conditions: [
      "Price data unavailable",
      "Token delisted or untradeable",
    ],
    result: "Round skipped, stakes refunded",
  },
  {
    label: "RUG",
    icon: <Skull size={24} weight="fill" className="text-rug" />,
    color: "text-rug",
    stripe: "rule-stripe-rug",
    conditions: [
      "Price drops 5%+ (P1 ≤ 0.95 × P0)",
    ],
    result: "RUG confirmed, rug callers eat",
  },
  {
    label: "PUMP",
    icon: <Rocket size={24} weight="fill" className="text-pump" />,
    color: "text-pump",
    stripe: "rule-stripe-pump",
    conditions: [
      "Price rises 5%+ (P1 ≥ 1.05 × P0)",
    ],
    result: "PUMP confirmed, pump callers win",
  },
  {
    label: "NO SCORE",
    icon: <Question size={24} weight="fill" className="text-muted" />,
    color: "text-muted",
    stripe: "rule-stripe-muted",
    conditions: ["Price stays within ±5% — no clear move"],
    result: "Too ambiguous, stakes refunded",
  },
];

export default function Settlement() {
  return (
    <section id="settlement" className="py-16 sm:py-20 px-4">
      <div className="max-w-content mx-auto">
        <motion.div {...fadeUp} className="text-center mb-4">
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted/60">
            The Rules
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold mt-3">
            Settlement Logic
          </h2>
        </motion.div>

        <motion.p {...fadeUp} className="text-muted text-center mb-4">
          Checked in strict order. First match wins.
        </motion.p>

        {/* Order flow */}
        <motion.div
          {...fadeUp}
          className="font-mono text-sm text-center mb-10 flex items-center justify-center gap-2 flex-wrap"
        >
          {[
            { label: "VOID", color: "text-warn bg-warn/10 border-warn/30" },
            { label: "RUG", color: "text-rug bg-rug/10 border-rug/30" },
            { label: "PUMP", color: "text-pump bg-pump/10 border-pump/30" },
            { label: "NS", color: "text-muted bg-muted/10 border-muted/30" },
          ].map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-muted/40 font-bold">→</span>}
              <span className={`px-3 py-1 rounded border font-bold ${item.color}`}>
                {item.label}
              </span>
            </span>
          ))}
        </motion.div>

        {/* Metrics explainer */}
        <motion.div
          {...fadeUp}
          className="mb-8 p-5 rounded-2xl bg-surfaceElevated border border-white/[0.04]"
        >
          <div className="flex items-center gap-2 mb-3">
            <Info size={20} weight="fill" className="text-accent" />
            <h3 className="font-heading font-bold text-sm">How we measure</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 font-mono text-xs max-w-md">
            {[
              { key: "P0", desc: "Price at round open (cached)" },
              { key: "P1", desc: "Price at settlement (via Birdeye)" },
            ].map((m) => (
              <div key={m.key} className="p-2.5 rounded-lg bg-surface">
                <span className="text-accent font-bold block">{m.key}</span>
                <span className="text-muted">{m.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Rule cards with left accent stripe */}
        <div className="grid sm:grid-cols-2 gap-4">
          {rules.map((r, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`${r.stripe} p-6 rounded-2xl bg-surfaceElevated border border-white/[0.04]`}
            >
              <div className="flex items-center gap-2 mb-3">
                {r.icon}
                <h3 className={`font-heading font-bold text-lg ${r.color}`}>
                  {r.label}
                </h3>
              </div>
              <ul className="space-y-1.5 mb-3">
                {r.conditions.map((c, j) => (
                  <li key={j} className="text-muted text-sm flex items-start gap-2">
                    <span className={`text-xs mt-1 ${r.color} opacity-60`}>›</span>
                    <span className="font-mono text-xs">{c}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-primary/70 border-t border-white/[0.04] pt-2 font-medium">
                {r.result}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
