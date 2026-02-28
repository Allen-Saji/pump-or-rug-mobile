import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors, Gradients, Glows } from "@/constants/theme";
import { useStore } from "@/lib/store";
import { GlowCard } from "@/components/GlowCard";
import { AnimatedEntry } from "@/components/AnimatedEntry";
import { StreakBanner } from "@/components/StreakBanner";
import { ResultBadge } from "@/components/ResultBadge";
import LottieView from "lottie-react-native";

export default function ProfileScreen() {
  const { user, walletConnected, connectWallet } = useStore();

  if (!user) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: Colors.dark }}
      >
        <LottieView
          source={require("@/assets/animations/loading-pulse.json")}
          autoPlay
          loop
          style={{ width: 80, height: 80 }}
        />
        <Text className="text-white/50 font-mono mt-2">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.dark }}>
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <AnimatedEntry>
          <View className="items-center pt-4 pb-6">
            {/* Avatar with gradient ring */}
            <LinearGradient
              colors={[Colors.pump, Colors.pump + "40"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-[84px] h-[84px] rounded-full items-center justify-center mb-3"
              style={Glows.pumpSubtle}
            >
              <View
                className="w-20 h-20 rounded-full items-center justify-center"
                style={{ backgroundColor: Colors.dark }}
              >
                <Text className="text-pump font-bold font-mono text-2xl">
                  {user.displayName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            </LinearGradient>

            <Text className="text-white font-bold font-mono text-lg">
              {user.displayName}
            </Text>

            {/* Wallet */}
            <Pressable
              onPress={connectWallet}
              className="flex-row items-center gap-1.5 mt-1 px-3 py-1 rounded-full"
              style={{ backgroundColor: Colors.dark200 }}
            >
              <Ionicons
                name="wallet"
                size={12}
                color={walletConnected ? Colors.pump : Colors.whiteDim}
              />
              <Text
                className="font-mono text-xs"
                style={{
                  color: walletConnected ? Colors.pump : Colors.whiteDim,
                }}
              >
                {walletConnected ? user.walletAddress : "Connect Wallet"}
              </Text>
            </Pressable>
          </View>
        </AnimatedEntry>

        {/* Stats row */}
        <AnimatedEntry index={1}>
          <View className="flex-row gap-2 mb-4">
            <StatBox
              label="POINTS"
              value={user.points.toLocaleString()}
              icon="star"
              color={Colors.gold}
            />
            <StatBox
              label="RANK"
              value={`#${user.rank}`}
              icon="trophy"
              color={Colors.pump}
            />
            <StatBox
              label="WIN RATE"
              value={`${Math.round((user.totalWins / user.totalBets) * 100)}%`}
              icon="trending-up"
              color={Colors.pump}
            />
          </View>
        </AnimatedEntry>

        {/* Streaks */}
        <AnimatedEntry index={2}>
          <StreakBanner
            winStreak={user.winStreak}
            dailyStreak={user.dailyStreak}
          />
        </AnimatedEntry>

        {/* Badges */}
        <AnimatedEntry index={3}>
          <View className="mt-6 mb-4">
            <Text className="text-white/40 font-mono text-xs mb-2 uppercase">
              Badges
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {user.badges.map((badge) => (
                <GlowCard
                  key={badge.id}
                  glowColor={Colors.gold + "40"}
                  className="px-3 py-2 flex-row items-center gap-2"
                >
                  <Ionicons
                    name={
                      badge.icon === "fire"
                        ? "flame"
                        : badge.icon === "moon"
                          ? "moon"
                          : "flash"
                    }
                    size={16}
                    color={Colors.gold}
                  />
                  <View>
                    <Text className="text-white font-mono text-xs font-bold">
                      {badge.name}
                    </Text>
                    <Text className="text-white/40 font-mono text-[10px]">
                      {badge.description}
                    </Text>
                  </View>
                </GlowCard>
              ))}
            </View>
          </View>
        </AnimatedEntry>

        {/* Bet history */}
        <AnimatedEntry index={4}>
          <View className="mt-2 mb-8">
            <Text className="text-white/40 font-mono text-xs mb-2 uppercase">
              Bet History
            </Text>
            {user.bets.map((bet, i) => (
              <GlowCard
                key={`${bet.id}-${i}`}
                borderColor={Colors.dark300 + "30"}
                className="flex-row items-center justify-between p-3 mb-1.5"
              >
                <View className="flex-row items-center gap-3">
                  <LinearGradient
                    colors={[
                      (bet.side === "pump" ? Colors.pump : Colors.rug) + "30",
                      (bet.side === "pump" ? Colors.pump : Colors.rug) + "10",
                    ]}
                    className="w-8 h-8 rounded-full items-center justify-center"
                  >
                    <Ionicons
                      name={bet.side === "pump" ? "arrow-up" : "arrow-down"}
                      size={16}
                      color={bet.side === "pump" ? Colors.pump : Colors.rug}
                    />
                  </LinearGradient>
                  <View>
                    <Text className="text-white font-mono font-bold text-sm">
                      {bet.tokenTicker}
                    </Text>
                    <Text className="text-white/40 font-mono text-[10px]">
                      {bet.amount} SOL
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  {bet.result ? (
                    <>
                      <ResultBadge result={bet.result} />
                      <Text
                        className="font-mono text-xs font-bold mt-1"
                        style={{
                          color:
                            (bet.payout ?? 0) > bet.amount
                              ? Colors.pump
                              : Colors.rug,
                        }}
                      >
                        {(bet.payout ?? 0) > bet.amount ? "+" : ""}
                        {((bet.payout ?? 0) - bet.amount).toFixed(2)} SOL
                      </Text>
                    </>
                  ) : (
                    <Text className="text-white/30 font-mono text-xs">
                      Pending
                    </Text>
                  )}
                </View>
              </GlowCard>
            ))}
          </View>
        </AnimatedEntry>

        {/* Settings placeholder */}
        <AnimatedEntry index={5}>
          <View className="mb-12">
            <Text className="text-white/40 font-mono text-xs mb-2 uppercase">
              Settings
            </Text>
            <GlowCard className="p-4 items-center">
              <Text className="text-white/30 font-mono text-sm">
                Coming soon
              </Text>
            </GlowCard>
          </View>
        </AnimatedEntry>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <GlowCard
      glowColor={color + "30"}
      className="flex-1 p-3 items-center"
    >
      <Ionicons name={icon as any} size={18} color={color} />
      <Text className="text-white font-bold font-mono text-lg mt-1">
        {value}
      </Text>
      <Text className="text-white/40 font-mono text-[10px]">{label}</Text>
    </GlowCard>
  );
}
