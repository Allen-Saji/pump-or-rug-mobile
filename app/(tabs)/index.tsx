import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors, Gradients, Glows } from "@/constants/theme";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { RoundCard } from "@/components/RoundCard";
import { BetSheet } from "@/components/BetSheet";
import { AnimatedEntry } from "@/components/AnimatedEntry";
import { SkeletonRoundCard } from "@/components/SkeletonRoundCard";
import type { BetSide, Token } from "@/lib/types";
import { useSolanaSignAndSend } from "@/lib/solana";

export default function HomeScreen() {
  const { rounds, loadRounds, placeBet, loading } = useStore();
  const signAndSend = useSolanaSignAndSend();
  const { authenticated, truncatedAddress } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [betToken, setBetToken] = useState<Token | null>(null);
  const [betSide, setBetSide] = useState<BetSide | null>(null);
  const [betRoundId, setBetRoundId] = useState<string | null>(null);

  useEffect(() => {
    loadRounds();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRounds();
    setRefreshing(false);
  }, []);

  const handleBet = (roundId: string, tokenId: string, side: BetSide) => {
    const round = rounds.find((r) => r.id === roundId);
    const token = round?.tokens.find((t) => t.id === tokenId);
    if (token) {
      setBetRoundId(roundId);
      setBetToken(token);
      setBetSide(side);
    }
  };

  const handleConfirmBet = async (amount: number) => {
    if (betRoundId && betToken && betSide) {
      await placeBet(betRoundId, betToken.id, betSide, amount, signAndSend);
      setBetToken(null);
      setBetSide(null);
      setBetRoundId(null);
    }
  };

  const handleConnectPress = () => {
    if (!authenticated) {
      router.push("/login");
    }
  };

  const openRound = rounds.find((r) => r.status === "open");
  const pastRounds = rounds.filter((r) => r.status !== "open");

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.dark }}>
      {/* Header */}
      <LinearGradient
        colors={Gradients.headerBg}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-row items-center gap-2">
          <Text
            className="text-pump font-bold font-mono text-xl"
            style={{
              textShadowColor: Colors.pump + "60",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 12,
            }}
          >
            PUMP
          </Text>
          <Text className="text-white/30 font-mono text-xl">or</Text>
          <Text
            className="text-rug font-bold font-mono text-xl"
            style={{
              textShadowColor: Colors.rug + "60",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 12,
            }}
          >
            RUG
          </Text>
        </View>

        <Pressable
          onPress={handleConnectPress}
          className="rounded-full px-3 py-1.5"
          style={{
            backgroundColor: authenticated
              ? Colors.pump + "20"
              : Colors.dark200,
            borderWidth: 1,
            borderColor: authenticated ? Colors.pump + "40" : Colors.dark300,
            ...(authenticated ? Glows.pumpSubtle : {}),
          }}
        >
          <Text
            className="font-mono text-xs font-bold"
            style={{
              color: authenticated ? Colors.pump : Colors.whiteDim,
            }}
          >
            {authenticated && truncatedAddress
              ? truncatedAddress
              : "Connect"}
          </Text>
        </Pressable>
      </LinearGradient>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.pump}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Loading skeletons */}
        {loading && rounds.length === 0 && (
          <View className="mt-2">
            <SkeletonRoundCard />
            <SkeletonRoundCard />
          </View>
        )}

        {/* Live round */}
        {openRound && (
          <View className="mb-2 mt-2">
            <AnimatedEntry>
              <View className="flex-row items-center gap-2 mb-2">
                <LinearGradient
                  colors={[Colors.pump + "40", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-[1px] flex-1"
                />
                <Text className="text-white/40 font-mono text-xs uppercase">
                  Live Round
                </Text>
                <LinearGradient
                  colors={["transparent", Colors.pump + "40"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-[1px] flex-1"
                />
              </View>
            </AnimatedEntry>
            <RoundCard
              round={openRound}
              onBet={(tokenId, side) => handleBet(openRound.id, tokenId, side)}
              index={0}
            />
          </View>
        )}

        {/* Past rounds */}
        {pastRounds.length > 0 && (
          <View className="mb-8">
            <AnimatedEntry index={1}>
              <View className="flex-row items-center gap-2 mb-2">
                <LinearGradient
                  colors={[Colors.whiteDim + "30", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-[1px] flex-1"
                />
                <Text className="text-white/40 font-mono text-xs uppercase">
                  Recent Rounds
                </Text>
                <LinearGradient
                  colors={["transparent", Colors.whiteDim + "30"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-[1px] flex-1"
                />
              </View>
            </AnimatedEntry>
            {pastRounds.map((round, i) => (
              <RoundCard
                key={round.id}
                round={round}
                onBet={(tokenId, side) => handleBet(round.id, tokenId, side)}
                index={i + 2}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bet sheet */}
      <BetSheet
        visible={!!betToken}
        token={betToken}
        side={betSide}
        onConfirm={handleConfirmBet}
        onClose={() => {
          setBetToken(null);
          setBetSide(null);
          setBetRoundId(null);
        }}
      />
    </SafeAreaView>
  );
}
