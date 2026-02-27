"use client";

import { motion } from "framer-motion";
import { TrendUp, TrendDown, Crown, Fire } from "@phosphor-icons/react";

export function TickerTape() {
  const items = [
    { text: "$BONK +420%", type: "up" as const },
    { text: "$SCAM -99%", type: "down" as const },
    { text: "$WIF +180%", type: "up" as const },
    { text: "$RUGME -87%", type: "down" as const },
    { text: "$DOGE2 +350%", type: "up" as const },
    { text: "$FAKE -94%", type: "down" as const },
    { text: "degen_king: 847pts", type: "crown" as const },
    { text: "$PUMP +260%", type: "up" as const },
    { text: "$DRAIN -91%", type: "down" as const },
    { text: "12 streak by whale_hunter", type: "fire" as const },
    { text: "$MOON +520%", type: "up" as const },
    { text: "$FLOOR -96%", type: "down" as const },
  ];

  const doubled = [...items, ...items];

  const getIcon = (type: string) => {
    switch (type) {
      case "up": return <TrendUp size={14} weight="bold" className="text-pump" />;
      case "down": return <TrendDown size={14} weight="bold" className="text-rug" />;
      case "crown": return <Crown size={14} weight="fill" className="text-warn" />;
      case "fire": return <Fire size={14} weight="fill" className="text-warn" />;
      default: return null;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "up": return "text-pump/70";
      case "down": return "text-rug/70";
      default: return "text-warn/70";
    }
  };

  return (
    <div className="w-full overflow-hidden border-y border-white/[0.04] bg-surface/60 py-2.5">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: [0, -50 * items.length] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className={`font-mono text-sm shrink-0 flex items-center gap-1.5 ${getColor(item.type)}`}
          >
            {getIcon(item.type)}
            {item.text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
