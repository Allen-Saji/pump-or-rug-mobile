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
import { Colors } from "@/constants/theme";
import { GlowCard } from "./GlowCard";
import { AnimatedEntry } from "./AnimatedEntry";
import { CountdownTimer } from "./CountdownTimer";
import { TokenSlot } from "./TokenSlot";
import type { Bet, Round } from "@/lib/types";

interface RoundCardProps {
  round: Round;
  onTokenSelect: (tokenId: string) => void;
  selectedTokenId?: string | null;
  index?: number;
  betsDisabled?: boolean;
  userBets?: Bet[];
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
        },
        style,
      ]}
    />
  );
}

export function RoundCard({ round, onTokenSelect, selectedTokenId, index = 0, betsDisabled, userBets = [] }: RoundCardProps) {
  const router = useRouter();
  const status = statusLabels[round.status];
  const isOpen = round.status === "open";
  const hasTwoTokens = round.tokens.length === 2;

  return (
    <AnimatedEntry index={index}>
      <GlowCard
        borderColor={isOpen ? Colors.pump + "60" : Colors.dark300}
        className="p-4 mb-4"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-white font-bold font-mono text-lg">
              Round #{round.roundNumber}
            </Text>
            <View className="flex-row items-center gap-1.5 rounded-full px-2 py-0.5"
              style={{ backgroundColor: status.color + "15" }}
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

        {/* Tap hint */}
        {isOpen && (
          <Text className="font-mono text-[10px] mb-2" style={{ color: Colors.whiteDim }}>
            Tap a token to see details
          </Text>
        )}

        {/* Token slots */}
        <View className={hasTwoTokens ? "flex-row items-stretch gap-2" : ""}>
          {round.tokens.map((token) => (
            <View key={token.id} className={hasTwoTokens ? "flex-1" : "mb-2"}>
              <TokenSlot
                token={token}
                isOpen={isOpen}
                onPress={() => onTokenSelect(token.id)}
                selected={selectedTokenId === token.id}
                disabled={betsDisabled}
                userBet={userBets.find((b) => b.tokenId === token.id)}
              />
            </View>
          ))}
        </View>
      </GlowCard>
    </AnimatedEntry>
  );
}
