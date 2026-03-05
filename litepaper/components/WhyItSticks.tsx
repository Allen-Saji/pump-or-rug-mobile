"use client";

import { motion } from "framer-motion";
import {
  Timer,
  ListNumbers,
  ShareNetwork,
  Fire,
  Lightning,
  BellRinging,
  CalendarCheck,
} from "@phosphor-icons/react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5 },
};

const features = [
  {
    icon: <Timer size={24} weight="duotone" className="text-accent" />,
    title: "15-Min Rhythm",
    desc: "New rounds every 15 minutes. Miss one? Another drops before you finish your coffee.",
  },
  {
    icon: <Fire size={24} weight="duotone" className="text-rug" />,
    title: "Win Streaks",
    desc: "Consecutive correct picks build up to 2.5x point multiplier. One miss resets it.",
  },
  {
    icon: <ListNumbers size={24} weight="duotone" className="text-pump" />,
    title: "Public Rankings",
    desc: "Season leaderboard. Top players split the prize pool. Points-based — you can't buy your way up.",
  },
  {
    icon: <CalendarCheck size={24} weight="duotone" className="text-pump" />,
    title: "Daily Streaks",
    desc: "Play every day for bonus points and badges. 30 days = Degen of the Month.",
  },
  {
    icon: <ShareNetwork size={24} weight="duotone" className="text-warn" />,
    title: "Shareable Wins",
    desc: "Generate win cards from your best calls. Let the timeline know.",
  },
  {
    icon: <Lightning size={24} weight="duotone" className="text-warn" />,
    title: "30-Second Sessions",
    desc: "Open. Pick. Close. Results drop 1 minute after the round ends.",
  },
  {
    icon: <BellRinging size={24} weight="duotone" className="text-accent" />,
    title: "Always-On Alerts",
    desc: "Push notifications when rounds open and settle. Never miss a play.",
  },
];

export default function WhyItSticks() {
  return (
    <section id="why-it-sticks" className="py-16 sm:py-20 px-4">
      <div className="max-w-content mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted/60">
            Why You Play
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold mt-3">
            Why It Sticks
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="p-6 rounded-2xl bg-surfaceElevated border border-white/[0.04]"
            >
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-heading font-bold text-base mb-1">{f.title}</h3>
              <p className="text-muted text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
