import { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Colors, Gradients, Glows } from "@/constants/theme";
import { GlowCard } from "./GlowCard";
import { AnimatedEntry } from "./AnimatedEntry";
import { CountdownTimer } from "./CountdownTimer";
import { TokenSlot } from "./TokenSlot";
import type { Round } from "@/lib/types";

interface RoundCardProps {
  round: Round;
  onBet: (tokenId: string, side: "pump" | "rug") => void;
  index?: number;
  betsDisabled?: boolean;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  open: { label: "LIVE", color: Colors.pump },
  settling: { label: "SETTLING", color: Colors.gold },
  settled: { label: "SETTLED", color: Colors.whiteDim },
  cancelled: { label: "CANCELLED", color: Colors.rug },
};

function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          ...Glows.pumpSubtle,
        },
        style,
      ]}
    />
  );
}

export function RoundCard({ round, onBet, index = 0, betsDisabled }: RoundCardProps) {
  const router = useRouter();
  const status = statusLabels[round.status];
  const isOpen = round.status === "open";

  return (
    <AnimatedEntry index={index}>
      <Pressable onPress={() => router.push(`/round/${round.id}`)}>
        <GlowCard
          glowColor={isOpen ? Colors.pump : undefined}
          borderColor={isOpen ? Colors.pump + "40" : Colors.dark300 + "40"}
          className="p-4 mb-4"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-white font-bold font-mono text-lg">
                Round #{round.roundNumber}
              </Text>
              <View className="flex-row items-center gap-1.5 rounded-full px-2 py-0.5"
                style={{ backgroundColor: status.color + "20" }}
              >
                {isOpen && <PulsingDot color={status.color} />}
                <Text
                  className="text-xs font-bold font-mono"
                  style={{ color: status.color }}
                >
                  {status.label}
                </Text>
              </View>
            </View>

            {isOpen && (
              <CountdownTimer targetTime={round.closesAt} label="Closes in" />
            )}
          </View>

          {/* Pool info */}
          <View className="flex-row gap-4 mb-3">
            <Text className="text-white/50 text-xs font-mono">
              Pool: {round.totalPool.toFixed(1)} SOL
            </Text>
            <Text className="text-white/50 text-xs font-mono">
              Bets: {round.totalBets}
            </Text>
          </View>

          {/* Token slots */}
          {round.tokens.map((token, i) => (
            <TokenSlot
              key={token.id}
              token={token}
              isOpen={isOpen}
              onPump={() => onBet(token.id, "pump")}
              onRug={() => onBet(token.id, "rug")}
              disabled={betsDisabled}
            />
          ))}
        </GlowCard>
      </Pressable>
    </AnimatedEntry>
  );
}
