"use client";

import { motion } from "framer-motion";
import {
  Eye,
  Timer,
  ChartLineUp,
  Robot,
  Shuffle,
} from "@phosphor-icons/react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5 },
};

const timelineSteps = [
  { label: "Token Selected", sub: "(hidden)", color: "var(--muted)" },
  { label: "Round Opens", sub: "(revealed)", color: "var(--accent)" },
  { label: "10m Prediction", sub: "Window", color: "var(--pump)" },
  { label: "Picks Lock", sub: "", color: "var(--warn)" },
  { label: "6h Settlement", sub: "", color: "var(--rug)" },
  { label: "Result", sub: "", color: "var(--pump)" },
];

const faqs = [
  {
    icon: <Eye size={28} weight="duotone" className="text-accent" />,
    question: "When do you predict?",
    answer:
      "Token is revealed when the round opens. You see it, research it, then make your PUMP or RUG call within 10 minutes. Your pick stays hidden from everyone else until the window closes.",
    accent: "accent",
  },
  {
    icon: <Timer size={28} weight="duotone" className="text-warn" />,
    question: "Why 6 hours, not 15 minutes?",
    answer:
      "Most people think a token's fate is sealed in the first 15 minutes. It's not. That's just bot wars, sniper buys, and hype noise. The real signal takes hours: does the community stick around? Does liquidity hold? 6h + TWAP pricing lets that play out, so the game rewards reading fundamentals, not reacting to a launch candle.",
    accent: "warn",
  },
  {
    icon: <Shuffle size={28} weight="duotone" className="text-pump" />,
    question: "How are tokens picked?",
    answer:
      "Pulled from pump.fun and bags.gm launchpads automatically. The engine selects them and they're not revealed until the round opens. No one can front-run or pre-position.",
    accent: "pump",
  },
];

export default function GameExplainer() {
  return (
    <section className="relative py-20 sm:py-28 px-4">
      <div className="max-w-content mx-auto">
        {/* Section header */}
        <motion.div {...fadeUp} className="text-center mb-16">
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted/60">
            Round Lifecycle
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold mt-3">
            How a Round Plays Out
          </h2>
        </motion.div>

        {/* Visual timeline */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-16"
        >
          {/* Desktop: horizontal */}
          <div className="hidden sm:flex items-start justify-between relative">
            {/* Connecting gradient line */}
            <div className="absolute top-5 left-[8%] right-[8%] h-px z-0">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-px w-full origin-left"
                style={{
                  background:
                    "linear-gradient(to right, var(--muted), var(--accent), var(--pump), var(--warn), var(--rug), var(--pump))",
                }}
              />
            </div>

            {timelineSteps.map((step, i) => (
              <div
                key={i}
                className="relative z-10 flex flex-col items-center text-center flex-1"
              >
                <div
                  className="w-10 h-10 rounded-full border-2 bg-bg flex items-center justify-center mb-3"
                  style={{ borderColor: step.color }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: step.color }}
                  />
                </div>
                <span className="font-mono text-xs font-bold text-primary/90">
                  {step.label}
                </span>
                {step.sub && (
                  <span className="font-mono text-[10px] text-muted/60">
                    {step.sub}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: vertical */}
          <div className="flex sm:hidden flex-col items-start gap-0 pl-4">
            {timelineSteps.map((step, i) => (
              <div key={i} className="relative flex items-start gap-4">
                {/* Vertical line */}
                {i < timelineSteps.length - 1 && (
                  <div
                    className="absolute left-[11px] top-10 bottom-0 w-px"
                    style={{
                      background: `linear-gradient(to bottom, ${step.color}, ${timelineSteps[i + 1].color})`,
                    }}
                  />
                )}
                <div
                  className="shrink-0 w-6 h-6 rounded-full border-2 bg-bg flex items-center justify-center mt-1"
                  style={{ borderColor: step.color }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: step.color }}
                  />
                </div>
                <div className="pb-6">
                  <span className="font-mono text-xs font-bold text-primary/90">
                    {step.label}
                  </span>
                  {step.sub && (
                    <span className="font-mono text-[10px] text-muted/60 ml-1">
                      {step.sub}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="rounded-2xl border border-white/[0.04] bg-surfaceElevated p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-surface border border-white/[0.04] flex items-center justify-center mb-4">
                {faq.icon}
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">
                {faq.question}
              </h3>
              <p className="text-muted text-sm leading-relaxed">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
