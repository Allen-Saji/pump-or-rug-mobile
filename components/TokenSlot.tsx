import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradients } from "@/constants/theme";
import { PumpRugButton } from "./PumpRugButton";
import { ResultBadge } from "./ResultBadge";
import type { Token } from "@/lib/types";

interface TokenSlotProps {
  token: Token;
  isOpen: boolean;
  onPump: () => void;
  onRug: () => void;
}

const platformColors: Record<string, string> = {
  "pump.fun": Colors.pump,
  "bags.fm": "#FF9500",
  raydium: "#9945FF",
};

export function TokenSlot({ token, isOpen, onPump, onRug }: TokenSlotProps) {
  const platColor = platformColors[token.platform] ?? Colors.dark300;

  return (
    <LinearGradient
      colors={[Colors.dark200, Colors.dark200 + "80"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-xl p-3 mb-2"
      style={{
        borderWidth: 1,
        borderColor: Colors.dark300 + "60",
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-1">
          {/* Token avatar with gradient ring */}
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{
              borderWidth: 2,
              borderColor: platColor + "60",
              backgroundColor: Colors.dark300,
            }}
          >
            <Text className="text-white font-bold text-xs">
              {token.ticker.replace("$", "").slice(0, 2)}
            </Text>
          </View>
          <View className="flex-1">
            <Text
              className="text-white font-bold font-mono text-sm"
              numberOfLines={1}
            >
              {token.ticker}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <LinearGradient
                colors={[platColor + "30", platColor + "10"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded px-1.5 py-0.5"
              >
                <Text
                  className="text-[10px] font-mono"
                  style={{ color: platColor }}
                >
                  {token.platform}
                </Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Price / result */}
        <View className="items-end">
          {token.result ? (
            <ResultBadge result={token.result} />
          ) : token.priceChangePercent !== undefined ? (
            <Text
              className="font-bold font-mono text-sm"
              style={{
                color:
                  token.priceChangePercent >= 0 ? Colors.pump : Colors.rug,
              }}
            >
              {token.priceChangePercent >= 0 ? "+" : ""}
              {token.priceChangePercent.toFixed(1)}%
            </Text>
          ) : null}
        </View>
      </View>

      {/* Action buttons */}
      {isOpen && (
        <View className="flex-row gap-2 mt-1">
          <View className="flex-1">
            <PumpRugButton side="pump" onPress={onPump} compact />
          </View>
          <View className="flex-1">
            <PumpRugButton side="rug" onPress={onRug} compact />
          </View>
        </View>
      )}
    </LinearGradient>
  );
}
