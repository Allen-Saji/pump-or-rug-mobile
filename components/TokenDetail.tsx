import { useState } from "react";
import { View, Text, Image, Pressable } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/theme";
import { proxyImageUrl } from "@/lib/utils";
import type { Bet, BetSide, Token } from "@/lib/types";

interface TokenDetailProps {
  token: Token;
  isOpen: boolean;
  onBet: (side: BetSide) => void;
  disabled?: boolean;
  userBet?: Bet;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatPrice(price: number): string {
  if (price < 0.0001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatAge(createdAt: number): string {
  const diffMs = Date.now() - createdAt;
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) {
    const mins = Math.floor(diffMs / 60_000);
    return `${mins}m ago`;
  }
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ActionButton({
  side,
  onPress,
  disabled,
}: {
  side: BetSide;
  onPress: () => void;
  disabled?: boolean;
}) {
  const isPump = side === "pump";
  const color = isPump ? Colors.pump : Colors.rug;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      onPressIn={() => { scale.value = withTiming(0.95, { duration: 100 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 150 }); }}
      disabled={disabled}
      style={[
        {
          flex: 1,
          borderRadius: 12,
          overflow: "hidden",
          opacity: disabled ? 0.4 : 1,
          backgroundColor: disabled ? Colors.dark300 : color,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 14,
        },
        animStyle,
      ]}
    >
      <View className="flex-row items-center gap-1.5">
        <Ionicons
          name={isPump ? "rocket-outline" : "skull-outline"}
          size={16}
          color={disabled ? Colors.dark400 : isPump ? Colors.dark : Colors.white}
        />
        <Text
          className="font-bold font-mono"
          style={{
            color: disabled ? Colors.dark400 : isPump ? Colors.dark : Colors.white,
            fontSize: 15,
          }}
        >
          {isPump ? "PUMP" : "RUG"}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="font-mono text-[10px] mb-0.5" style={{ color: Colors.whiteDim }}>
        {label}
      </Text>
      <Text className="font-mono font-bold text-sm" style={{ color: color ?? Colors.white }}>
        {value}
      </Text>
    </View>
  );
}

export function TokenDetail({ token, isOpen, onBet, disabled, userBet }: TokenDetailProps) {
  const [imgError, setImgError] = useState(false);
  const hasBet = !!userBet;
  const betColor = userBet?.side === "pump" ? Colors.pump : Colors.rug;

  const totalPool = (token.pumpPool ?? 0) + (token.rugPool ?? 0);
  const pumpPct = totalPool > 0 ? ((token.pumpPool ?? 0) / totalPool) * 100 : 50;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      className="rounded-2xl p-4 mt-2"
      style={{
        backgroundColor: Colors.dark100,
        borderWidth: 1,
        borderColor: Colors.dark300,
      }}
    >
      {/* Token header */}
      <View className="flex-row items-center gap-3 mb-4">
        <View
          className="w-12 h-12 rounded-full items-center justify-center overflow-hidden"
          style={{ backgroundColor: Colors.dark300 }}
        >
          {token.imageUrl && !imgError ? (
            <Image
              source={{ uri: proxyImageUrl(token.imageUrl) }}
              className="w-full h-full"
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <Text className="text-white font-bold text-sm">
              {token.ticker.replace("$", "").slice(0, 2)}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold font-mono text-lg" numberOfLines={1}>
            {token.name}
          </Text>
          <Text className="font-mono text-xs" style={{ color: Colors.whiteDim }}>
            {token.ticker} · {token.platform}
          </Text>
        </View>
      </View>

      {/* Stats grid */}
      <View
        className="rounded-xl p-3 mb-4"
        style={{ backgroundColor: Colors.dark200 }}
      >
        <View className="flex-row mb-2.5">
          <StatItem label="PRICE" value={formatPrice(token.priceAtOpen)} />
          {token.marketCap !== undefined && (
            <StatItem label="MCAP" value={formatUsd(token.marketCap)} />
          )}
          {token.liquidity !== undefined && (
            <StatItem label="LIQ" value={formatUsd(token.liquidity)} />
          )}
        </View>
        <View className="flex-row">
          {token.volume24h !== undefined && token.volume24h > 0 && (
            <StatItem label="24H VOL" value={formatUsd(token.volume24h)} />
          )}
          {token.createdAt !== undefined && token.createdAt > 0 && (
            <StatItem label="AGE" value={formatAge(token.createdAt)} />
          )}
          <StatItem
            label="POOL"
            value={totalPool > 0 ? `${totalPool.toFixed(2)} SOL` : "—"}
          />
        </View>
      </View>

      {/* Pump vs Rug sentiment bar */}
      {totalPool > 0 && (
        <View className="mb-4">
          <View className="flex-row justify-between mb-1.5">
            <Text className="font-mono text-[10px] font-bold" style={{ color: Colors.pump }}>
              PUMP {pumpPct.toFixed(0)}%
            </Text>
            <Text className="font-mono text-[10px] font-bold" style={{ color: Colors.rug }}>
              {(100 - pumpPct).toFixed(0)}% RUG
            </Text>
          </View>
          <View className="flex-row h-2 rounded-full overflow-hidden" style={{ backgroundColor: Colors.dark300 }}>
            <View
              style={{
                width: `${pumpPct}%`,
                backgroundColor: Colors.pump,
                borderTopLeftRadius: 4,
                borderBottomLeftRadius: 4,
              }}
            />
            <View
              style={{
                width: `${100 - pumpPct}%`,
                backgroundColor: Colors.rug,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
              }}
            />
          </View>
        </View>
      )}

      {/* Already bet indicator */}
      {hasBet && (
        <View
          className="rounded-xl py-3 px-4 items-center mb-3"
          style={{
            backgroundColor: betColor + "10",
            borderWidth: 1,
            borderColor: betColor + "30",
          }}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={userBet.side === "pump" ? "arrow-up-circle" : "arrow-down-circle"}
              size={18}
              color={betColor}
            />
            <Text className="font-bold font-mono text-sm" style={{ color: betColor }}>
              You {userBet.side === "pump" ? "PUMPED" : "RUGGED"} {userBet.amount} SOL
            </Text>
          </View>
        </View>
      )}

      {/* Action buttons — only when open + no bet */}
      {isOpen && !hasBet && (
        <View className="flex-row gap-3">
          <ActionButton side="pump" onPress={() => onBet("pump")} disabled={disabled} />
          <ActionButton side="rug" onPress={() => onBet("rug")} disabled={disabled} />
        </View>
      )}
    </Animated.View>
  );
}
