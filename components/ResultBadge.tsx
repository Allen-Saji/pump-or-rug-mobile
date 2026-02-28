import { Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/theme";
import type { BetResult } from "@/lib/types";

interface ResultBadgeProps {
  result: BetResult;
  size?: "sm" | "md";
}

const resultConfig: Record<
  BetResult,
  { label: string; color: string; gradientBg: [string, string] }
> = {
  pump: {
    label: "PUMP",
    color: Colors.pump,
    gradientBg: [Colors.pump + "30", Colors.pump + "10"],
  },
  rug: {
    label: "RUG",
    color: Colors.rug,
    gradientBg: [Colors.rug + "30", Colors.rug + "10"],
  },
  void: {
    label: "VOID",
    color: Colors.void,
    gradientBg: [Colors.void + "30", Colors.void + "10"],
  },
  no_score: {
    label: "NO SCORE",
    color: Colors.noScore,
    gradientBg: [Colors.noScore + "30", Colors.noScore + "10"],
  },
};

export function ResultBadge({ result, size = "sm" }: ResultBadgeProps) {
  const config = resultConfig[result];

  return (
    <LinearGradient
      colors={config.gradientBg}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-full items-center justify-center"
      style={{
        paddingHorizontal: size === "sm" ? 8 : 12,
        paddingVertical: size === "sm" ? 2 : 4,
        shadowColor: config.color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      }}
    >
      <Text
        className="font-bold font-mono"
        style={{
          color: config.color,
          fontSize: size === "sm" ? 10 : 13,
        }}
      >
        {config.label}
      </Text>
    </LinearGradient>
  );
}
