import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/theme";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useWallet } from "@/lib/wallet";
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
  const { solBalance, refreshBalance } = useWallet();
  const [refreshing, setRefreshing] = useState(false);
  const [betToken, setBetToken] = useState<Token | null>(null);
  const [betSide, setBetSide] = useState<BetSide | null>(null);
  const [betRoundId, setBetRoundId] = useState<string | null>(null);

  useEffect(() => {
    loadRounds();
  }, []);

  // Auto-refresh when the open round expires
  useEffect(() => {
    const openRound = rounds.find((r) => r.status === "open");
    if (!openRound) return;

    const msUntilClose = openRound.closesAt - Date.now();
    if (msUntilClose <= 0) {
      loadRounds();
      return;
    }

    const timer = setTimeout(() => {
      loadRounds();
    }, msUntilClose + 2000);

    return () => clearTimeout(timer);
  }, [rounds]);

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
    <SafeAreaView className="flex-1" edges={["top"]} style={{ backgroundColor: Colors.dark }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3"
        style={{ backgroundColor: Colors.dark }}
      >
        <Text className="font-mono text-2xl font-bold">
          <Text style={{ color: Colors.pump }}>PUMP</Text>
          <Text style={{ color: Colors.whiteDim }}> or </Text>
          <Text style={{ color: Colors.rug }}>RUG</Text>
        </Text>

        {authenticated ? (
          <View className="flex-row items-center gap-2">
            {solBalance !== null && (
              <View
                className="rounded-full px-2.5 py-1.5"
                style={{ backgroundColor: Colors.dark200, borderWidth: 1, borderColor: Colors.dark300 }}
              >
                <Text className="font-mono text-xs font-bold" style={{ color: Colors.white }}>
                  {solBalance.toFixed(2)} SOL
                </Text>
              </View>
            )}
            <Pressable
              onPress={handleConnectPress}
              className="rounded-full px-3 py-1.5"
              style={{
                backgroundColor: Colors.pump + "12",
                borderWidth: 1,
                borderColor: Colors.pump + "30",
              }}
            >
              <Text
                className="font-mono text-xs font-bold"
                style={{ color: Colors.pump }}
              >
                {truncatedAddress ?? "..."}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleConnectPress}
            className="rounded-full px-3 py-1.5"
            style={{
              backgroundColor: Colors.dark200,
              borderWidth: 1,
              borderColor: Colors.dark300,
            }}
          >
            <Text
              className="font-mono text-xs font-bold"
              style={{ color: Colors.whiteDim }}
            >
              Connect
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 16 }}
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
                <View
                  className="h-[1px] flex-1"
                  style={{ backgroundColor: Colors.dark300 }}
                />
                <Text style={{ color: Colors.whiteDim }} className="font-mono text-xs uppercase">
                  Live Round
                </Text>
                <View
                  className="h-[1px] flex-1"
                  style={{ backgroundColor: Colors.dark300 }}
                />
              </View>
            </AnimatedEntry>
            <RoundCard
              round={openRound}
              onBet={(tokenId, side) => handleBet(openRound.id, tokenId, side)}
              index={0}
              betsDisabled={!authenticated}
            />
          </View>
        )}

        {/* Past rounds */}
        {pastRounds.length > 0 && (
          <View className="mb-8">
            <AnimatedEntry index={1}>
              <View className="flex-row items-center gap-2 mb-2">
                <View
                  className="h-[1px] flex-1"
                  style={{ backgroundColor: Colors.dark300 }}
                />
                <Text style={{ color: Colors.whiteDim }} className="font-mono text-xs uppercase">
                  Recent Rounds
                </Text>
                <View
                  className="h-[1px] flex-1"
                  style={{ backgroundColor: Colors.dark300 }}
                />
              </View>
            </AnimatedEntry>
            {pastRounds.map((round, i) => (
              <RoundCard
                key={round.id}
                round={round}
                onBet={(tokenId, side) => handleBet(round.id, tokenId, side)}
                index={i + 2}
                betsDisabled={!authenticated}
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
