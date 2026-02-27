"use client";

import { motion } from "framer-motion";
import { Coin, Crosshair, Scales } from "@phosphor-icons/react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5 },
};

const steps = [
  {
    num: "01",
    icon: <Coin size={32} weight="duotone" className="text-accent" />,
    title: "Tokens Drop",
    desc: "Every hour, four fresh tokens — two from pump.fun, two from bags.fm. You don't know which until the round opens.",
  },
  {
    num: "02",
    icon: <Crosshair size={32} weight="duotone" className="text-pump" />,
    title: "Lock Your Call",
    desc: "10 minutes to call PUMP or RUG on each token and choose your stake: 0.01 to 3 SOL per token. Your picks are hidden until the window closes. No herding.",
  },
  {
    num: "03",
    icon: <Scales size={32} weight="duotone" className="text-warn" />,
    title: "Engine Settles",
    desc: "After 6 hours, the TWAP engine checks price and liquidity. The math decides the outcome.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 sm:py-28 px-4">
      <div className="max-w-content mx-auto">
        <motion.div {...fadeUp} className="text-center mb-16">
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted/60">
            Gameplay Loop
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold mt-3">
            How It Works
          </h2>
        </motion.div>

        {/* 3-step horizontal flow */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center px-6 py-8"
            >
              {/* Connecting line (between steps) */}
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-[4.5rem] left-[60%] right-[-40%] h-px">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.2 }}
                    className="h-px w-full origin-left"
                    style={{
                      background: "linear-gradient(to right, var(--pump), var(--accent))",
                    }}
                  />
                </div>
              )}

              {/* Step number */}
              <span className="font-mono text-xs text-muted/40 mb-3">{s.num}</span>

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-surface border border-white/[0.04] flex items-center justify-center mb-5">
                {s.icon}
              </div>

              <h3 className="font-heading font-bold text-xl mb-2">{s.title}</h3>
              <p className="text-muted text-sm max-w-[280px]">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Entry cost pill */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 flex justify-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/[0.06] bg-surface/50">
            <span className="font-mono text-sm text-muted">Stake:</span>
            <span className="font-mono text-sm text-primary font-bold">0.01–3 SOL</span>
            <span className="font-mono text-xs text-muted/60">per pick</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
