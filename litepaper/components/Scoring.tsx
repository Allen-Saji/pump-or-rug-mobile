"use client";

import { motion } from "framer-motion";
import { Trophy } from "@phosphor-icons/react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5 },
};

const scores = [
  { val: "+10", label: "Correct pick", color: "text-pump" },
  { val: "-8", label: "Wrong pick", color: "text-rug" },
  { val: "0", label: "VOID / NS", color: "text-muted" },
  { val: "+3", label: "Both correct", color: "text-warn" },
];

export default function Scoring() {
  return (
    <section className="py-16 sm:py-20 px-4">
      <div className="max-w-content mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy size={28} weight="duotone" className="text-warn" />
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold">
            Scoring
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {scores.map((s, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl p-6 border border-white/[0.04] bg-surfaceElevated text-center"
            >
              <span className={`${s.color} text-4xl sm:text-5xl font-black font-mono block`}>
                {s.val}
              </span>
              <p className="text-muted text-xs mt-2 font-mono">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Break-even callout */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 max-w-lg mx-auto text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-accent/20 bg-surface/50">
            <span className="font-mono text-sm text-muted">Break-even accuracy:</span>
            <span className="font-mono text-lg text-accent font-bold">44.4%</span>
          </div>
          <p className="text-muted/60 text-xs mt-3 font-mono">
            No naive strategy dominates.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
