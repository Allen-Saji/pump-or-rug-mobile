"use client";

import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5 },
};

export default function ProductShot() {
  return (
    <section className="py-20 sm:py-28 px-4 overflow-hidden">
      <div className="max-w-content mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <span className="font-mono text-xs text-accent tracking-[0.2em] uppercase opacity-60">
            Mobile-First
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold mt-3">
            Built for <span className="text-accent">Thumbs</span>
          </h2>
        </motion.div>

        <motion.div
          {...fadeUp}
          className="flex justify-center"
        >
          {/* 3D perspective phone mockup */}
          <div
            className="relative"
            style={{
              perspective: "1200px",
            }}
          >
            {/* Phone glow */}
            <div className="absolute inset-0 bg-pump/8 rounded-[44px] blur-[60px] scale-110" />

            <div
              className="relative w-[280px] sm:w-[300px] h-[560px] sm:h-[600px] rounded-[44px] border border-white/[0.08] bg-bg p-3 shadow-2xl"
              style={{
                transform: "rotateY(-8deg) rotateX(4deg)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-bg rounded-b-2xl border-x border-b border-white/[0.08] z-10" />

              {/* Screen content */}
              <div className="h-full rounded-[36px] bg-surface overflow-hidden flex flex-col">
                {/* Status bar */}
                <div className="flex justify-between items-center px-6 pt-8 pb-2">
                  <span className="font-mono text-[10px] text-muted">9:41</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-1.5 rounded-sm bg-pump" />
                    <div className="w-3 h-1.5 rounded-sm bg-pump/60" />
                    <div className="w-3 h-1.5 rounded-sm bg-pump/30" />
                  </div>
                </div>

                {/* Round header */}
                <div className="text-center px-4 py-3">
                  <div className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-3 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="font-mono text-[10px] text-accent">LIVE ROUND #1847</span>
                  </div>
                  <p className="font-heading font-bold text-lg mt-2">$DOGE2.0</p>
                  <p className="font-mono text-[10px] text-muted">pump.fun</p>
                </div>

                {/* Price chart mini */}
                <div className="px-4 py-2">
                  <svg viewBox="0 0 200 40" className="w-full h-8 opacity-30">
                    <polyline
                      points="0,30 20,28 40,32 60,25 80,20 100,22 120,15 140,18 160,10 180,12 200,8"
                      fill="none"
                      stroke="#23F28B"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="flex justify-between font-mono text-[9px] text-muted">
                    <span>$0.00042</span>
                    <span className="text-pump">+127%</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex-1 flex flex-col justify-center gap-3 px-4">
                  <div className="bg-pump/15 border-2 border-pump/40 rounded-2xl p-4 text-center">
                    <span className="font-heading font-black text-pump text-2xl tracking-wider">
                      PUMP
                    </span>
                    <p className="text-[11px] text-pump/60 mt-1">Price moons 2x+</p>
                  </div>

                  {/* VS divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warn/30 to-transparent" />
                    <span className="font-mono text-[10px] text-warn font-bold px-2 py-0.5 border border-warn/30 rounded bg-bg">VS</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warn/30 to-transparent" />
                  </div>

                  <div className="bg-rug/15 border-2 border-rug/40 rounded-2xl p-4 text-center">
                    <span className="font-heading font-black text-rug text-2xl tracking-wider">
                      RUG
                    </span>
                    <p className="text-[11px] text-rug/60 mt-1">Price dumps 50%+</p>
                  </div>
                </div>

                {/* Timer bar */}
                <div className="px-4 pb-6 pt-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-mono text-[10px] text-muted">Time left</span>
                    <span className="font-mono text-[11px] text-warn font-bold">08:42</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pump to-warn"
                      style={{ width: "75%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
