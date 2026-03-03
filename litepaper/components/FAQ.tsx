"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDown } from "@phosphor-icons/react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5 },
};

const faqs = [
  {
    q: "What is Pump or Rug?",
    a: "A prediction game. Every hour, four tokens drop straight from pump.fun. You have a full 60-minute window to call PUMP or RUG on each. After the hour closes, the price is checked and you find out if you were right.",
  },
  {
    q: "What does PUMP mean? What about RUG?",
    a: "PUMP means you think the token's price will rise at least 10% by the end of the hour. RUG means you think it'll drop 10%+. These come from crypto slang: \"pump\" = price goes up, \"rug pull\" = creators dump and run.",
  },
  {
    q: "How is the price checked?",
    a: "We use Birdeye, an independent Solana data provider. At settlement time, the engine fetches each token's current price from Birdeye and compares it to the price when the round opened.",
  },
  {
    q: "What is pump.fun?",
    a: "Solana's biggest memecoin launchpad — where anyone can create and launch a new token. We pull our round tokens from pump.fun's live feed automatically.",
  },
  {
    q: "What is SOL?",
    a: "Solana's native cryptocurrency. You stake 0.01 to 1 SOL per pick.",
  },
  {
    q: "What does VOID mean?",
    a: "A round gets voided when the data is bad: not enough liquidity, not enough volume, missing price data, or the price sources disagree too much. Nobody wins or loses points, and stakes are refunded.",
  },
  {
    q: "What is NO SCORE?",
    a: "When the price doesn't move enough to qualify as a PUMP or a RUG. The token just kind of sat there. Nobody scores, and stakes are refunded.",
  },
  {
    q: "What do P0, P1, L0, L1 mean?",
    a: "P0 = starting price (cached when round opens). P1 = ending price (fetched from Birdeye at settlement). If P1/P0 shows ≥10% move, the outcome is decided.",
  },
  {
    q: "How does scoring work?",
    a: "Points track reputation and are independent of stake. Correct call = +5 points. Wrong call = -3 points. Perfect round (all correct) = 2x multiplier. Correctly calling a heavy rug (>25% drop) = +3 rug sniper bonus. Win streaks add +2 per consecutive win, stacking. Break-even accuracy is 37.5%.",
  },
  {
    q: "How do payouts work?",
    a: "Stake 0.01–1 SOL per pick. Win = 1.85x your stake returned. Lose = you lose your stake. VOID or NO SCORE = full refund.",
  },
  {
    q: "What is the leaderboard?",
    a: "Players are ranked by points (not by how much they stake). Leaderboards run daily, weekly, by season (4 weeks), and all-time. Season prize pool comes from accumulated rake: #1 gets 50%, #2-3 share 20%, #4-10 share 20%, #11-50 share 10%. Minimum 20 picks/week for eligibility.",
  },
  {
    q: "How do streaks work?",
    a: "Win streaks: consecutive correct picks earn +2 bonus points per streak level. The bonus stacks — a 5th consecutive win earns +10 bonus on top of the base +5. One wrong pick resets it. Daily streaks: play at least once per day to keep your streak alive. Miss a day and it resets to zero.",
  },
  {
    q: "Why 1-hour rounds?",
    a: "Long enough for real price action to play out. Short enough to keep the game moving — 24 rounds per day, new tokens every hour. You make your call, lock it in, and results drop fast.",
  },
  {
    q: "Can someone manipulate the outcome?",
    a: "We've made it very expensive to try. Liquidity floors, hidden token selection, 24h cooldown on repeats, and independent price oracle (Birdeye). Max round profit is ~4 SOL per round — not worth the effort.",
  },
  {
    q: "What does \"sell-blocked\" mean?",
    a: "Some scam tokens let you buy but block you from selling. If we detect this behavior, the token is automatically ruled a RUG.",
  },
  {
    q: "Is this gambling?",
    a: "It's a prediction game with variable stakes (0.01–1 SOL per pick) and a scoring system based on accuracy. Points are stake-independent — you can't buy your way to the top of the leaderboard.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left rounded-2xl border border-white/[0.04] bg-surfaceElevated px-6 py-5 transition-colors hover:border-white/[0.08]"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-heading font-bold text-sm sm:text-base">
          {q}
        </h3>
        <CaretDown
          size={18}
          weight="bold"
          className={`shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-muted text-sm leading-relaxed pt-3">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="py-16 sm:py-20 px-4">
      <div className="max-w-content mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted/60">
            Questions
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold mt-3">
            FAQ
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ duration: 0.4, delay: i * 0.03 }}
            >
              <FAQItem q={faq.q} a={faq.a} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
