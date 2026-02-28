import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors, Gradients, Glows, type GradientColors } from "@/constants/theme";
import { AnimatedEntry } from "./AnimatedEntry";
import type { LeaderboardEntry } from "@/lib/types";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  index?: number;
}

const medalColors: Record<number, string> = {
  1: Colors.gold,
  2: Colors.silver,
  3: Colors.bronze,
};

const rankGradients: Record<number, GradientColors> = {
  1: Gradients.goldRank,
  2: Gradients.silverRank,
  3: Gradients.bronzeRank,
};

export function LeaderboardRow({ entry, index = 0 }: LeaderboardRowProps) {
  const isTop3 = entry.rank <= 3;
  const medalColor = medalColors[entry.rank];
  const gradient = rankGradients[entry.rank];

  const content = (
    <View className="flex-row items-center">
      {/* Rank */}
      <View className="w-10 items-center">
        {isTop3 ? (
          <Ionicons name="medal" size={22} color={medalColor} />
        ) : (
          <Text className="text-white/60 font-mono font-bold text-sm">
            {entry.rank}
          </Text>
        )}
      </View>

      {/* Avatar */}
      <View
        className="w-8 h-8 rounded-full items-center justify-center mr-3"
        style={{
          backgroundColor: isTop3 ? medalColor + "20" : Colors.dark300,
          borderWidth: isTop3 ? 1.5 : 0,
          borderColor: isTop3 ? medalColor + "50" : "transparent",
        }}
      >
        <Text
          className="font-bold text-xs"
          style={{ color: isTop3 ? medalColor : Colors.whiteDim }}
        >
          {entry.displayName.slice(0, 2).toUpperCase()}
        </Text>
      </View>

      {/* Name */}
      <View className="flex-1">
        <Text
          className="font-mono font-bold text-sm"
          style={{
            color: entry.isCurrentUser ? Colors.pump : Colors.white,
          }}
          numberOfLines={1}
        >
          {entry.displayName}
          {entry.isCurrentUser && (
            <Text className="text-white/40"> (you)</Text>
          )}
        </Text>
      </View>

      {/* Streak */}
      {entry.winStreak > 0 && (
        <View className="flex-row items-center gap-0.5 mr-3">
          <Ionicons name="flame" size={12} color={Colors.rug} />
          <Text className="text-white/60 font-mono text-xs">
            {entry.winStreak}
          </Text>
        </View>
      )}

      {/* Points */}
      <Text className="text-white font-mono font-bold text-sm">
        {entry.points.toLocaleString()}
      </Text>
    </View>
  );

  const containerStyle = {
    borderWidth: entry.isCurrentUser ? 1 : 0,
    borderColor: Colors.pump + "30",
    ...(entry.isCurrentUser ? Glows.pumpSubtle : {}),
  };

  return (
    <AnimatedEntry index={index}>
      {isTop3 ? (
        <LinearGradient
          colors={gradient!}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-4 py-3 rounded-xl mb-1.5"
          style={containerStyle}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          className="px-4 py-3 rounded-xl mb-1.5"
          style={{
            backgroundColor: entry.isCurrentUser
              ? Colors.pump + "10"
              : Colors.dark100,
            ...containerStyle,
          }}
        >
          {content}
        </View>
      )}
    </AnimatedEntry>
  );
}
