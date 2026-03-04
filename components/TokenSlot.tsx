import { useState } from "react";
import { View, Text, Image } from "react-native";
import { Colors } from "@/constants/theme";
import { PumpRugButton } from "./PumpRugButton";
import { ResultBadge } from "./ResultBadge";
import { proxyImageUrl } from "@/lib/utils";
import type { Token } from "@/lib/types";

interface TokenSlotProps {
  token: Token;
  isOpen: boolean;
  onPump: () => void;
  onRug: () => void;
  disabled?: boolean;
}

const platformColors: Record<string, string> = {
  "pump.fun": Colors.pump,
  "bags.fm": "#FF9500",
  raydium: "#9945FF",
};

export function TokenSlot({ token, isOpen, onPump, onRug, disabled }: TokenSlotProps) {
  const platColor = platformColors[token.platform] ?? Colors.dark400;
  const [imgError, setImgError] = useState(false);

  return (
    <View
      className="rounded-xl p-3 mb-2"
      style={{
        backgroundColor: Colors.dark200,
        borderWidth: 1,
        borderColor: Colors.dark300,
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-1">
          {/* Token avatar */}
          <View
            className="w-9 h-9 rounded-full items-center justify-center overflow-hidden"
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
              <Text className="text-white font-bold text-xs">
                {token.ticker.replace("$", "").slice(0, 2)}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text
              className="text-white font-bold font-mono text-sm"
              numberOfLines={1}
            >
              {token.ticker}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View
                className="rounded px-1.5 py-0.5"
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
            <PumpRugButton side="pump" onPress={onPump} compact disabled={disabled} />
          </View>
          <View className="flex-1">
            <PumpRugButton side="rug" onPress={onRug} compact disabled={disabled} />
          </View>
        </View>
      )}
    </View>
  );
}
