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
    a: "A prediction game. Every hour, four tokens appear — two from pump.fun, two from bags.fm. You have 45 minutes to call PUMP or RUG on each. After 6 hours the price is checked and you find out if you were right.",
  },
  {
    q: "What does PUMP mean? What about RUG?",
    a: "PUMP means you think the token's price will rise at least 20% within 6 hours while liquidity stays healthy. RUG means you think it'll drop 20%+ or the liquidity will drain. These come from crypto slang: \"pump\" = price goes up, \"rug pull\" = creators dump and run.",
  },
  {
    q: "What is TWAP?",
    a: "Time-Weighted Average Price. Instead of checking one price at one moment (easy to manipulate), TWAP averages the price over a window of time. We use it so a single whale trade can't decide the outcome.",
  },
  {
    q: "What are pump.fun and bags.fm?",
    a: "Token launchpads on Solana where anyone can create and launch a new token. We pull our round tokens from these platforms automatically.",
  },
  {
    q: "What is SOL?",
    a: "Solana's native cryptocurrency. You stake 0.01 to 3 SOL per pick.",
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
    a: "P0 = starting price (TWAP of the first few minutes). P1 = ending price (TWAP of the last 15 min). L0 = starting liquidity. L1 = ending liquidity. These are compared to decide if a token pumped, rugged, or did nothing.",
  },
  {
    q: "How does scoring work?",
    a: "Points track reputation and are independent of stake. Correct call = +10 points. Wrong call = -3 points. Get 3 of 4 right in a round for a +5 bonus. Perfect round (4/4) = +15 bonus. Win streaks multiply points up to 2.5x. Break-even accuracy is 23.1%.",
  },
  {
    q: "How do payouts work?",
    a: "Stake 0.01–3 SOL per pick. Win = 1.8x your stake returned. Lose = you lose your stake. VOID or NO SCORE = full refund. There's a 5% rake on winnings only (effective return 1.76x), which funds the prize pool and operations.",
  },
  {
    q: "What is the leaderboard?",
    a: "Players are ranked by points (not by how much they stake). Leaderboards run daily, weekly, by season (4 weeks), and all-time. Season prize pool comes from accumulated rake: #1 gets 50%, #2-3 share 20%, #4-10 share 20%, #11-50 share 10%. Minimum 20 picks/week for eligibility.",
  },
  {
    q: "How do streaks work?",
    a: "Win streaks: consecutive correct picks build a point multiplier — 1.2x at 3 picks, 1.5x at 5, 2.0x at 8, capped at 2.5x at 12+. One wrong pick resets it. VOID/NS freezes the streak. Daily streaks: play at least once per day (UTC) for bonus points — Day 1: +5, Day 3: +10, Day 7: +25 + badge, Day 14: +50, Day 30: +100 + Degen of the Month badge. Miss a day and it resets.",
  },
  {
    q: "Why 6 hours instead of 15 minutes?",
    a: "The first 15 minutes of any token launch is chaos: bots, snipers, and hype traders. That's noise, not signal. 6 hours gives the real market time to show up. Combined with TWAP pricing, it makes the game about skill, not reflexes.",
  },
  {
    q: "Can someone manipulate the outcome?",
    a: "We've made it very expensive to try. Minimum liquidity and volume floors, TWAP instead of spot price, outlier trade filtering, and multi-source price checks. Max round profit is ~9 SOL, well below the $7k+ manipulation cost.",
  },
  {
    q: "What does \"sell-blocked\" mean?",
    a: "Some scam tokens let you buy but block you from selling. If we detect this behavior, the token is automatically ruled a RUG.",
  },
  {
    q: "Is this gambling?",
    a: "It's a prediction game with variable stakes (0.01–3 SOL per pick) and a scoring system based on accuracy. The 5% rake on winnings funds the prize pool that gets redistributed to top players. Points are stake-independent — you can't buy your way to the top of the leaderboard.",
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
