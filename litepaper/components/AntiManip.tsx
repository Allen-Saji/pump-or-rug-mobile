"use client";

import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5 },
};

const checks = [
  {
    title: "Birdeye Price Oracle",
    desc: "Settlement prices fetched from Birdeye — independent, trusted Solana data provider. No self-reported prices.",
  },
  {
    title: "Liquidity Floor",
    desc: "Minimum liquidity required to enter the round. No micro-cap tokens that can be moved with pocket change.",
  },
  {
    title: "4h Cooldown",
    desc: "No token repeats within 4 hours. Fresh tokens every round — no patterns to exploit.",
  },
  {
    title: "Hidden Selection",
    desc: "Tokens not revealed until the round opens. Zero front-running possible.",
  },
  {
    title: "Prediction Reveal Delay",
    desc: "Individual picks stay hidden until the window closes. No copying, no herding.",
  },
  {
    title: "Weighted Random Draw",
    desc: "Top candidates picked by weighted random — highest activity scores are favored but not guaranteed. No deterministic front-running.",
  },
];

export default function AntiManip() {
  return (
    <section id="anti-manip" className="py-16 sm:py-20 px-4">
      <div className="max-w-content mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted/60">
            Trust Layer
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold mt-3">
            Built to Be <span className="text-pump">Fair</span>
          </h2>
          <p className="text-muted mt-3 max-w-md mx-auto">
            Every rule exists to make gaming the system uneconomical.
          </p>
        </motion.div>

        {/* Numbered spec list — single column */}
        <div className="max-w-2xl mx-auto space-y-3">
          {checks.map((c, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-surfaceElevated border border-white/[0.04]"
            >
              <span className="font-mono text-sm text-pump/40 font-bold shrink-0 w-6 text-right">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-heading font-semibold text-sm text-primary">
                  {c.title}
                </h3>
                <p className="text-muted text-sm mt-0.5">{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Cost callout */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 max-w-xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-pump/20 bg-surface/50">
            <span className="font-mono text-sm text-muted">Estimated manipulation cost:</span>
            <span className="font-mono text-lg text-pump font-bold">$10,000+</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
