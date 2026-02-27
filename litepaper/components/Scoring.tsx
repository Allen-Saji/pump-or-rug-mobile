"use client";

import { motion } from "framer-motion";
import { Trophy, CurrencyDollar, Star, Fire } from "@phosphor-icons/react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5 },
};

const payouts = [
  { val: "0.01–3", label: "SOL stake per pick", color: "text-accent" },
  { val: "1.8x", label: "Win payout", color: "text-pump" },
  { val: "0x", label: "Lose stake", color: "text-rug" },
  { val: "Refund", label: "VOID / NS", color: "text-muted" },
];

const points = [
  { val: "+10", label: "Correct pick", color: "text-pump" },
  { val: "-3", label: "Wrong pick", color: "text-rug" },
  { val: "0", label: "VOID / NS", color: "text-muted" },
  { val: "+5", label: "3 of 4 bonus", color: "text-warn" },
  { val: "+15", label: "Perfect round", color: "text-accent" },
];

const winStreaks = [
  { streak: "0–2", mult: "1.0x" },
  { streak: "3", mult: "1.2x" },
  { streak: "5", mult: "1.5x" },
  { streak: "8", mult: "2.0x" },
  { streak: "12+", mult: "2.5x" },
];

const dailyStreaks = [
  { day: "Day 1", reward: "+5 pts" },
  { day: "Day 3", reward: "+10 pts" },
  { day: "Day 7", reward: "+25 pts + badge" },
  { day: "Day 14", reward: "+50 pts" },
  { day: "Day 30", reward: "+100 pts + badge" },
];

function ScoringCard({ val, label, color }: { val: string; label: string; color: string }) {
  return (
    <div className="rounded-2xl p-6 border border-white/[0.04] bg-surfaceElevated text-center">
      <span className={`${color} text-3xl sm:text-4xl font-black font-mono block`}>
        {val}
      </span>
      <p className="text-muted text-xs mt-2 font-mono">{label}</p>
    </div>
  );
}

export default function Scoring() {
  return (
    <section className="py-16 sm:py-20 px-4">
      <div className="max-w-content mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy size={28} weight="duotone" className="text-warn" />
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold">
            Scoring &amp; Payouts
          </h2>
        </motion.div>

        {/* --- PAYOUTS --- */}
        <motion.div {...fadeUp} className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <CurrencyDollar size={20} weight="duotone" className="text-pump" />
            <h3 className="font-heading font-bold text-lg">Payouts</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
            {payouts.map((p, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <ScoringCard {...p} />
              </motion.div>
            ))}
          </div>
          <p className="text-muted/60 text-xs mt-3 font-mono">
            5% rake on winnings only → funds prize pool + ops. Effective win = 1.76x stake.
          </p>
        </motion.div>

        {/* --- POINTS --- */}
        <motion.div {...fadeUp} className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Star size={20} weight="duotone" className="text-accent" />
            <h3 className="font-heading font-bold text-lg">Points</h3>
            <span className="text-muted/40 text-xs font-mono ml-auto">reputation, stake-independent</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-4xl">
            {points.map((p, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <ScoringCard {...p} />
              </motion.div>
            ))}
          </div>
          {/* Break-even callout */}
          <div className="mt-4">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-accent/20 bg-surface/50">
              <span className="font-mono text-sm text-muted">Break-even accuracy:</span>
              <span className="font-mono text-lg text-accent font-bold">23.1%</span>
            </div>
          </div>
        </motion.div>

        {/* --- STREAKS --- */}
        <motion.div {...fadeUp}>
          <div className="flex items-center gap-2 mb-4">
            <Fire size={20} weight="duotone" className="text-rug" />
            <h3 className="font-heading font-bold text-lg">Streaks</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Win streak table */}
            <div className="rounded-2xl border border-white/[0.04] bg-surfaceElevated p-5">
              <h4 className="font-heading font-bold text-sm mb-3">Win Streak → Point Multiplier</h4>
              <div className="space-y-1.5">
                {winStreaks.map((w, i) => (
                  <div key={i} className="flex items-center justify-between font-mono text-sm">
                    <span className="text-muted">{w.streak} picks</span>
                    <span className="text-pump font-bold">{w.mult}</span>
                  </div>
                ))}
              </div>
              <p className="text-muted/50 text-xs mt-3 font-mono">
                Wrong pick resets to 0. VOID/NS freezes streak.
              </p>
            </div>

            {/* Daily streak table */}
            <div className="rounded-2xl border border-white/[0.04] bg-surfaceElevated p-5">
              <h4 className="font-heading font-bold text-sm mb-3">Daily Streak → Bonus Points</h4>
              <div className="space-y-1.5">
                {dailyStreaks.map((d, i) => (
                  <div key={i} className="flex items-center justify-between font-mono text-sm">
                    <span className="text-muted">{d.day}</span>
                    <span className="text-accent font-bold">{d.reward}</span>
                  </div>
                ))}
              </div>
              <p className="text-muted/50 text-xs mt-3 font-mono">
                ≥1 pick/day (UTC). Miss a day → reset. Badges permanent.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
