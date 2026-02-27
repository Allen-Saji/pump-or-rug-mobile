"use client";

import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center px-4 pt-16 overflow-hidden"
    >
      {/* Gradient orbs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-pump/8 rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-rug/8 rounded-full blur-[200px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[200px]" />
      </motion.div>

      <div className="relative text-center max-w-4xl mx-auto z-10">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
          className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-primary/60 mb-6"
        >
          Every hour. Two tokens. One call.
        </motion.p>

        {/* Title — massive split-color */}
        <h1 className="font-heading text-[4rem] sm:text-[5.5rem] font-black tracking-[-0.03em] leading-[0.95]">
          <motion.span
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease }}
            className="inline-block text-pump"
          >
            PUMP
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.5, delay: 0.5, ease }}
            className="inline-block text-muted mx-3 sm:mx-5 text-[2.5rem] sm:text-[3.5rem] font-normal"
          >
            OR
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease }}
            className="inline-block text-rug"
          >
            RUG
          </motion.span>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease }}
          className="mt-6 text-lg sm:text-xl text-muted max-w-xl mx-auto"
        >
          The degen prediction arena. Two launchpad tokens every hour.
          Call it or get rekt.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.9, ease }}
          className="mt-10"
        >
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 bg-pump text-black font-heading font-bold text-lg rounded-full px-10 py-4 hover:brightness-110 transition"
          >
            Enter the Arena
          </a>
        </motion.div>

        {/* Stat pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1, ease }}
          className="mt-10 flex justify-center gap-3 sm:gap-4 flex-wrap"
        >
          {[
            { value: "48", label: "rounds/day" },
            { value: "0.001 SOL", label: "per pick" },
            { value: "6h", label: "settlement" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.1 + i * 0.1, ease }}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.06] bg-surface/50"
            >
              <span className="font-mono text-sm font-bold text-primary">{stat.value}</span>
              <span className="font-mono text-xs text-muted">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
