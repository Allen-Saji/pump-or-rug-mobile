"use client";

import { motion } from "framer-motion";
import {
  Funnel,
  Database,
  Timer,
  CurrencyDollar,
  ChartBar,
  ShieldCheck,
  Hourglass,
  ListNumbers,
  Shuffle,
} from "@phosphor-icons/react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5 },
};

const filters = [
  {
    icon: <Timer size={20} weight="duotone" className="text-accent" />,
    label: "Age",
    threshold: "15 min – 72 hours",
    why: "Too young = no data. Too old = stale. Sweet spot catches tokens with enough history to analyze but still in their volatile phase.",
  },
  {
    icon: <CurrencyDollar size={20} weight="duotone" className="text-pump" />,
    label: "Liquidity",
    threshold: "≥ $25,000",
    why: "Thin pools are trivially manipulable. $25k floor makes market-moving trades expensive enough to deter gaming.",
  },
  {
    icon: <ChartBar size={20} weight="duotone" className="text-warn" />,
    label: "Volume",
    threshold: "≥ $30,000 (30 min)",
    why: "Real trading activity means real price discovery. Low volume = wash trades or dead token.",
  },
  {
    icon: <ShieldCheck size={20} weight="duotone" className="text-pump" />,
    label: "Tradable + Data",
    threshold: "Must pass both",
    why: "Token must be actively tradable and have on-chain data feeds. No honeypots, no black boxes.",
  },
  {
    icon: <Hourglass size={20} weight="duotone" className="text-accent" />,
    label: "Cooldown",
    threshold: "≥ 24 hours since last round",
    why: "Prevents the same token from appearing in back-to-back rounds. Keeps the game fresh and unpredictable.",
  },
];

const scoringFactors = [
  {
    label: "30m volume (45%)",
    desc: "Primary liquidity + attention signal",
    color: "text-pump",
    dotColor: "bg-pump",
  },
  {
    label: "Tx count (30%)",
    desc: "Broad participation, not one wallet",
    color: "text-accent",
    dotColor: "bg-accent",
  },
  {
    label: "Holder growth (15%)",
    desc: "New unique holders over time",
    color: "text-warn",
    dotColor: "bg-warn",
  },
  {
    label: "Social momentum (10%)",
    desc: "Community buzz and mentions",
    color: "text-primary",
    dotColor: "bg-primary",
  },
];

export default function TokenSelection() {
  return (
    <section id="token-selection" className="py-16 sm:py-20 px-4">
      <div className="max-w-content mx-auto">
        {/* Section header */}
        <motion.div {...fadeUp} className="text-center mb-12">
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted/60">
            Token Pipeline
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold mt-3">
            How Tokens Get <span className="text-pump">Selected</span>
          </h2>
          <p className="text-muted mt-3 max-w-lg mx-auto">
            Every hour, the engine picks four tokens — two from each platform.
            Each launchpad feeds its own pipeline: filter, score, select.
          </p>
        </motion.div>

        {/* Pipeline overview — 4 phases */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <div className="font-mono text-sm text-center mb-10 flex items-center justify-center gap-2 flex-wrap">
            {[
              { label: "Sources", icon: <Database size={14} />, color: "text-accent bg-accent/10 border-accent/30" },
              { label: "Filter", icon: <Funnel size={14} />, color: "text-pump bg-pump/10 border-pump/30" },
              { label: "Score", icon: <ListNumbers size={14} />, color: "text-warn bg-warn/10 border-warn/30" },
              { label: "Select", icon: <Shuffle size={14} />, color: "text-pump bg-pump/10 border-pump/30" },
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted/40 font-bold">→</span>}
                <span className={`px-3 py-1.5 rounded border font-bold flex items-center gap-1.5 ${item.color}`}>
                  {item.icon}
                  {item.label}
                </span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Step 1: Sources */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6 p-5 rounded-2xl bg-surfaceElevated border border-white/[0.04]"
        >
          <div className="flex items-center gap-2 mb-3">
            <Database size={20} weight="fill" className="text-accent" />
            <h3 className="font-heading font-bold text-sm">
              1. Token Sources
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: "pump.fun", color: "pump", desc: "Solana's biggest memecoin launchpad" },
              { name: "bags.fm", color: "accent", desc: "Community-driven token launchpad" },
            ].map((src) => (
              <div
                key={src.name}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface"
              >
                <div className={`w-2 h-8 rounded-full bg-${src.color}`} />
                <div>
                  <span className={`font-mono text-sm font-bold text-${src.color}`}>
                    {src.name}
                  </span>
                  <p className="text-muted text-xs mt-0.5">{src.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted/60 text-xs mt-3 font-mono">
            Each platform feeds its own independent pipeline
          </p>
        </motion.div>

        {/* Step 2: Filters */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-4 px-1">
            <Funnel size={20} weight="fill" className="text-pump" />
            <h3 className="font-heading font-bold text-sm">
              2. Five-Gate Filter (per platform)
            </h3>
            <span className="ml-auto font-mono text-xs text-muted/60">
              applied independently to each feed
            </span>
          </div>

          <div className="space-y-2">
            {filters.map((f, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.06 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-surfaceElevated border border-white/[0.04]"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-surface border border-white/[0.04] flex items-center justify-center mt-0.5">
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h4 className="font-heading font-semibold text-sm text-primary">
                      {f.label}
                    </h4>
                    <span className="font-mono text-xs text-pump/70">
                      {f.threshold}
                    </span>
                  </div>
                  <p className="text-muted text-sm mt-1">{f.why}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Step 3: Scoring */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6 p-5 rounded-2xl bg-surfaceElevated border border-white/[0.04]"
        >
          <div className="flex items-center gap-2 mb-4">
            <ListNumbers size={20} weight="fill" className="text-warn" />
            <h3 className="font-heading font-bold text-sm">
              3. Activity Scoring
            </h3>
          </div>

          <div className="p-3 rounded-xl bg-surface mb-4">
            <code className="font-mono text-xs sm:text-sm text-primary/80">
              score = 0.45×vol30m + 0.30×txCount + 0.15×holderGrowth + 0.10×social
            </code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {scoringFactors.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`w-2 h-2 rounded-full ${f.dotColor} mt-1.5 shrink-0`} />
                <div>
                  <span className={`font-mono text-xs font-bold ${f.color}`}>
                    {f.label}
                  </span>
                  <p className="text-muted text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-muted text-sm mt-4">
            Survivors are ranked by activity score per platform. The top 5 from
            each platform advance to final selection.
          </p>
        </motion.div>

        {/* Step 4: Selection */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="p-5 rounded-2xl bg-surfaceElevated border border-white/[0.04]"
        >
          <div className="flex items-center gap-2 mb-3">
            <Shuffle size={20} weight="fill" className="text-pump" />
            <h3 className="font-heading font-bold text-sm">
              4. Weighted Random Pick
            </h3>
          </div>
          <p className="text-muted text-sm mb-4">
            Each platform&apos;s top 5 are assigned weights proportional to their
            activity scores. A weighted random draw picks 2 winners per
            platform — the highest scorers are most likely but not guaranteed,
            keeping every round unpredictable.
          </p>
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-pump/20 bg-surface/50">
            <span className="font-mono text-xs text-muted">Result:</span>
            <span className="font-mono text-sm text-pump font-bold">
              4 tokens per round
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
