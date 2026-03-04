import { useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Colors, Gradients } from "@/constants/theme";
import { useStore } from "@/lib/store";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { AnimatedEntry } from "@/components/AnimatedEntry";
import { SkeletonLeaderboardRow } from "@/components/SkeletonLeaderboardRow";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/lib/types";

const DUMMY_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: "d1", displayName: "SolMaxi.sol", points: 2480, winStreak: 12 },
  { rank: 2, userId: "d2", displayName: "RugSniffer69", points: 2115, winStreak: 7 },
  { rank: 3, userId: "d3", displayName: "PumpItUp", points: 1890, winStreak: 5 },
  { rank: 4, userId: "d4", displayName: "DgenAlpha", points: 1645, winStreak: 3 },
  { rank: 5, userId: "d5", displayName: "ChadTrader", points: 1420, winStreak: 4 },
  { rank: 6, userId: "d6", displayName: "MoonBoi", points: 1180, winStreak: 0 },
  { rank: 7, userId: "d7", displayName: "WhaleWatcher", points: 955, winStreak: 2 },
  { rank: 8, userId: "d8", displayName: "TokenSniper", points: 810, winStreak: 0 },
  { rank: 9, userId: "d9", displayName: "NgmiKing", points: 640, winStreak: 1 },
  { rank: 10, userId: "d10", displayName: "DiamondPaws", points: 505, winStreak: 0 },
];

const periods: { key: LeaderboardPeriod; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "season", label: "Season" },
  { key: "all-time", label: "All-Time" },
];

export default function LeaderboardScreen() {
  const { leaderboard, leaderboardPeriod, setLeaderboardPeriod, loading } = useStore();

  useEffect(() => {
    setLeaderboardPeriod("weekly");
  }, []);

  return (
    <SafeAreaView className="flex-1" edges={["top"]} style={{ backgroundColor: Colors.dark }}>
      {/* Header */}
      <LinearGradient
        colors={Gradients.headerBg}
        className="px-4 pt-3 pb-2"
      >
        <AnimatedEntry>
          <Text
            className="text-white font-bold font-mono text-2xl"
            style={{
              textShadowColor: Colors.pump + "30",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 8,
            }}
          >
            Leaderboard
          </Text>
        </AnimatedEntry>
      </LinearGradient>

      {/* Period tabs */}
      <AnimatedEntry index={1}>
        <View className="flex-row px-4 mb-4 mt-2 gap-2">
          {periods.map((p) => {
            const isActive = leaderboardPeriod === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => setLeaderboardPeriod(p.key)}
                className="flex-1 rounded-lg overflow-hidden"
              >
                <LinearGradient
                  colors={
                    isActive
                      ? [Colors.pump + "30", Colors.pump + "10"]
                      : [Colors.dark200, Colors.dark200]
                  }
                  className="py-2 items-center"
                  style={{
                    borderWidth: isActive ? 1 : 0,
                    borderColor: Colors.pump + "40",
                    borderRadius: 8,
                  }}
                >
                  <Text
                    className="font-mono text-xs font-bold"
                    style={{
                      color: isActive ? Colors.pump : Colors.whiteDim,
                    }}
                  >
                    {p.label}
                  </Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>
      </AnimatedEntry>

      {/* Leaderboard list */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {loading && leaderboard.length === 0 && (
          <View className="mt-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonLeaderboardRow key={i} />
            ))}
          </View>
        )}
        {(leaderboard.length > 0 ? leaderboard : DUMMY_LEADERBOARD).map((entry, i) => (
          <LeaderboardRow key={entry.userId} entry={entry} index={i} />
        ))}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
