import { useState } from "react";
import { View, Text, Image, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/theme";
import { ResultBadge } from "./ResultBadge";
import { proxyImageUrl } from "@/lib/utils";
import type { Bet, Token } from "@/lib/types";

interface TokenSlotProps {
  token: Token;
  isOpen: boolean;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  userBet?: Bet;
}

const platformColors: Record<string, string> = {
  "pump.fun": Colors.pump,
  "bags.fm": "#FF9500",
  raydium: "#9945FF",
};

export function TokenSlot({ token, isOpen, onPress, selected, disabled, userBet }: TokenSlotProps) {
  const platColor = platformColors[token.platform] ?? Colors.dark400;
  const [imgError, setImgError] = useState(false);
  const hasBet = !!userBet;
  const betColor = userBet?.side === "pump" ? Colors.pump : Colors.rug;

  return (
    <Pressable onPress={onPress}>
      <View
        className="rounded-xl p-3"
        style={{
          backgroundColor: selected ? Colors.dark300 : Colors.dark200,
          borderWidth: 1.5,
          borderColor: hasBet
            ? betColor + "50"
            : selected
            ? Colors.pump
            : Colors.dark300,
          flex: 1,
        }}
      >
        {/* Token avatar */}
        <View className="items-center mb-2">
          <View
            className="w-14 h-14 rounded-full items-center justify-center overflow-hidden"
            style={{
              borderWidth: 2,
              borderColor: platColor + "40",
              backgroundColor: Colors.dark300,
            }}
          >
            {token.imageUrl && !imgError ? (
              <Image
                source={{ uri: proxyImageUrl(token.imageUrl) }}
                className="w-full h-full"
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <Text className="text-white font-bold text-base">
                {token.ticker.replace("$", "").slice(0, 2)}
              </Text>
            )}
          </View>
        </View>

        {/* Ticker + platform */}
        <View className="items-center mb-1">
          <Text
            className="text-white font-bold font-mono text-sm"
            numberOfLines={1}
          >
            {token.ticker}
          </Text>
          <View
            className="rounded px-1.5 py-0.5 mt-1"
            style={{ backgroundColor: platColor + "18" }}
          >
            <Text
              className="text-[10px] font-mono"
              style={{ color: platColor }}
            >
              {token.platform}
            </Text>
          </View>
        </View>

        {/* Result badge for settled tokens */}
        {token.result && (
          <View className="items-center mt-1">
            <ResultBadge result={token.result} />
            {token.priceChangePercent !== undefined && (
              <Text
                className="font-bold font-mono text-xs mt-1"
                style={{
                  color: token.priceChangePercent >= 0 ? Colors.pump : Colors.rug,
                }}
              >
                {token.priceChangePercent >= 0 ? "+" : ""}
                {token.priceChangePercent.toFixed(1)}%
              </Text>
            )}
          </View>
        )}

        {/* User bet status */}
        {hasBet && (
          <View
            className="rounded-lg py-1.5 px-2 items-center mt-1.5"
            style={{
              backgroundColor: betColor + "12",
              borderWidth: 1,
              borderColor: betColor + "30",
            }}
          >
            <View className="flex-row items-center gap-1">
              <Ionicons
                name={userBet.side === "pump" ? "arrow-up-circle" : "arrow-down-circle"}
                size={12}
                color={betColor}
              />
              <Text className="font-bold font-mono text-[10px]" style={{ color: betColor }}>
                {userBet.side === "pump" ? "PUMPED" : "RUGGED"}
              </Text>
            </View>
            <Text className="font-mono text-[10px]" style={{ color: betColor }}>
              {userBet.amount} SOL
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
