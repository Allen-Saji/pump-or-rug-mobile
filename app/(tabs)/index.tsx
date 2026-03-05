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
import { TokenDetail } from "@/components/TokenDetail";
import { BetSheet } from "@/components/BetSheet";
import { AnimatedEntry } from "@/components/AnimatedEntry";
import { SkeletonRoundCard } from "@/components/SkeletonRoundCard";
import type { Bet, BetSide, Token } from "@/lib/types";
import { useSolanaSignAndSend } from "@/lib/solana";

export default function HomeScreen() {
  const { rounds, loadRounds, placeBet, loading, userBets, loadUserBets } = useStore();
  const signAndSend = useSolanaSignAndSend();
  const { authenticated, truncatedAddress } = useAuth();
  const { solBalance, refreshBalance } = useWallet();
  const [refreshing, setRefreshing] = useState(false);
  const [betToken, setBetToken] = useState<Token | null>(null);
  const [betSide, setBetSide] = useState<BetSide | null>(null);
  const [betRoundId, setBetRoundId] = useState<string | null>(null);

  // Track which token is expanded for detail view
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

  useEffect(() => {
    loadRounds();
    if (authenticated) loadUserBets();
  }, [authenticated]);

  // Auto-refresh when the open round expires + when settlement completes
  useEffect(() => {
    const openRound = rounds.find((r) => r.status === "open");
    if (!openRound) return;

    const now = Date.now();
    const msUntilClose = openRound.closesAt - now;
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (msUntilClose <= 0) {
      loadRounds();
    } else {
      // Refresh when round closes
      timers.push(setTimeout(() => { loadRounds(); }, msUntilClose + 2000));
    }

    // Refresh after settlement (closesAt + 65s buffer)
    const settlesAt = openRound.closesAt + 65_000;
    const msUntilSettle = settlesAt - now;
    if (msUntilSettle > 0) {
      timers.push(setTimeout(() => {
        loadRounds();
        if (authenticated) loadUserBets();
      }, msUntilSettle));
    }

    return () => timers.forEach(clearTimeout);
  }, [rounds, authenticated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadRounds(), authenticated ? loadUserBets() : Promise.resolve()]);
    setRefreshing(false);
  }, [authenticated]);

  const handleTokenSelect = (tokenId: string) => {
    setSelectedTokenId((prev) => (prev === tokenId ? null : tokenId));
  };

  const handleBet = (roundId: string, token: Token, side: BetSide) => {
    setBetRoundId(roundId);
    setBetToken(token);
    setBetSide(side);
  };

  const handleConfirmBet = async (amount: number) => {
    if (betRoundId && betToken && betSide) {
      await placeBet(betRoundId, betToken.id, betSide, amount, signAndSend);
      if (authenticated) loadUserBets();
    }
  };

  const handleConnectPress = () => {
    if (!authenticated) {
      router.push("/login");
    }
  };

  const openRound = rounds.find((r) => r.status === "open");
  const pastRounds = rounds.filter((r) => r.status !== "open");

  // Find the selected token object from the current rounds
  const selectedToken = (() => {
    if (!selectedTokenId) return null;
    for (const round of rounds) {
      const token = round.tokens.find((t) => t.id === selectedTokenId);
      if (token) return { token, round };
    }
    return null;
  })();

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
              onTokenSelect={handleTokenSelect}
              selectedTokenId={selectedTokenId}
              index={0}
              betsDisabled={!authenticated}
              userBets={userBets.filter((b) => b.roundId === openRound.id)}
            />

            {/* Token detail panel — below the round card */}
            {selectedToken && selectedToken.round.id === openRound.id && (
              <TokenDetail
                token={selectedToken.token}
                isOpen={openRound.status === "open"}
                onBet={(side) => handleBet(openRound.id, selectedToken.token, side)}
                disabled={!authenticated}
                userBet={userBets.find((b) => b.tokenId === selectedToken.token.id)}
              />
            )}
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
              <View key={round.id}>
                <RoundCard
                  round={round}
                  onTokenSelect={handleTokenSelect}
                  selectedTokenId={selectedTokenId}
                  index={i + 2}
                  betsDisabled={!authenticated}
                  userBets={userBets.filter((b) => b.roundId === round.id)}
                />
                {selectedToken && selectedToken.round.id === round.id && (
                  <TokenDetail
                    token={selectedToken.token}
                    isOpen={round.status === "open"}
                    onBet={(side) => handleBet(round.id, selectedToken.token, side)}
                    disabled={!authenticated}
                    userBet={userBets.find((b) => b.tokenId === selectedToken.token.id)}
                  />
                )}
              </View>
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
