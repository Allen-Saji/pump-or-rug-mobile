import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import LottieView from "lottie-react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/theme";
import { useStore } from "@/lib/store";
import { GlowCard } from "@/components/GlowCard";
import { AnimatedEntry } from "@/components/AnimatedEntry";
import { TokenSlot } from "@/components/TokenSlot";
import { TokenDetail } from "@/components/TokenDetail";
import { CountdownTimer } from "@/components/CountdownTimer";
import { BetSheet } from "@/components/BetSheet";
import { SkeletonRoundDetail } from "@/components/SkeletonRoundDetail";
import type { BetSide, Token } from "@/lib/types";
import { useSolanaSignAndSend } from "@/lib/solana";

function ResolveCountdown({ settlesAt }: { settlesAt: number }) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.ceil((settlesAt - Date.now()) / 1000))
  );

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((settlesAt - Date.now()) / 1000));
      setSeconds(remaining);
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [settlesAt]);

  if (seconds <= 0) {
    return (
      <Text className="font-mono text-[10px]" style={{ color: Colors.gold }}>
        Resolving...
      </Text>
    );
  }

  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name="time-outline" size={10} color={Colors.gold} />
      <Text className="font-mono text-[10px]" style={{ color: Colors.gold }}>
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
      </Text>
    </View>
  );
}

export default function RoundDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentRound, loadRound, userBets: allUserBets, loadUserBets, placeBet, claimBet, claiming } = useStore();
  const signAndSend = useSolanaSignAndSend();
  const [betToken, setBetToken] = useState<Token | null>(null);
  const [betSide, setBetSide] = useState<BetSide | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadRound(id);
      loadUserBets(id);
    }
  }, [id]);

  // Auto-refresh after settlement
  useEffect(() => {
    if (!currentRound || currentRound.status === "settled") return;
    const settlesAt = currentRound.closesAt + 65_000;
    const ms = settlesAt - Date.now();
    if (ms <= 0) return;
    const timer = setTimeout(() => {
      loadRound(currentRound.id);
      loadUserBets(currentRound.id);
    }, ms);
    return () => clearTimeout(timer);
  }, [currentRound?.id, currentRound?.status]);

  const handleTokenSelect = (tokenId: string) => {
    setSelectedTokenId((prev) => (prev === tokenId ? null : tokenId));
  };

  const handleBet = (token: Token, side: BetSide) => {
    setBetToken(token);
    setBetSide(side);
  };

  const handleConfirmBet = useCallback(
    async (amount: number) => {
      if (currentRound && betToken && betSide) {
        await placeBet(currentRound.id, betToken.id, betSide, amount, signAndSend);
        loadUserBets(currentRound.id);
      }
    },
    [currentRound, betToken, betSide, placeBet, signAndSend, loadUserBets]
  );

  if (!currentRound) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: Colors.dark }}
      >
        <View
          className="flex-row items-center px-4 py-3 gap-3"
          style={{ backgroundColor: Colors.dark }}
        >
          <View
            className="w-9 h-9 rounded-full"
            style={{ backgroundColor: Colors.dark200 }}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ width: 120, height: 18, backgroundColor: Colors.dark200, borderRadius: 6 }} />
            <View style={{ width: 60, height: 12, backgroundColor: Colors.dark200, borderRadius: 4 }} />
          </View>
        </View>
        <SkeletonRoundDetail />
      </SafeAreaView>
    );
  }

  const isOpen = currentRound.status === "open";
  const isSettled = currentRound.status === "settled";

  const userBets =
    allUserBets.filter((b) => b.roundId === currentRound.id);
  const totalStaked = userBets.reduce((s, b) => s + b.amount, 0);
  const totalPayout = userBets.reduce((s, b) => s + (b.payout ?? 0), 0);
  const pnl = totalPayout - totalStaked;

  const selectedToken = selectedTokenId
    ? currentRound.tokens.find((t) => t.id === selectedTokenId) ?? null
    : null;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.dark }}>
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-3 gap-3"
        style={{ backgroundColor: Colors.dark }}
      >
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: Colors.dark200 }}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.white} />
        </Pressable>

        <View className="flex-1">
          <Text className="text-white font-bold font-mono text-lg">
            Round #{currentRound.roundNumber}
          </Text>
          <Text className="text-white/40 font-mono text-xs uppercase">
            {currentRound.status}
          </Text>
        </View>

        {isOpen && (
          <CountdownTimer targetTime={currentRound.closesAt} label="Closes" />
        )}
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Pool stats */}
        <AnimatedEntry>
          <GlowCard className="flex-row p-3 mb-4 mt-3 gap-4">
            <View className="flex-1 items-center">
              <Text className="text-white/40 font-mono text-[10px]">POOL</Text>
              <Text className="text-white font-bold font-mono">
                {currentRound.totalPool.toFixed(1)} SOL
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-white/40 font-mono text-[10px]">BETS</Text>
              <Text className="text-white font-bold font-mono">
                {currentRound.totalBets}
              </Text>
            </View>
            {isSettled && userBets.length > 0 && (
              <View className="flex-1 items-center">
                <Text className="text-white/40 font-mono text-[10px]">
                  YOUR P&L
                </Text>
                <Text
                  className="font-bold font-mono"
                  style={{
                    color: pnl >= 0 ? Colors.pump : Colors.rug,
                  }}
                >
                  {pnl >= 0 ? "+" : ""}
                  {pnl.toFixed(2)} SOL
                </Text>
              </View>
            )}
          </GlowCard>
        </AnimatedEntry>

        {/* Tokens */}
        <AnimatedEntry index={1}>
          <Text className="text-white/40 font-mono text-xs mb-2 uppercase">
            Tap a token to view details
          </Text>
        </AnimatedEntry>
        <AnimatedEntry index={2}>
          <View className={currentRound.tokens.length === 2 ? "flex-row items-stretch gap-2" : ""}>
            {currentRound.tokens.map((token) => (
              <View key={token.id} className={currentRound.tokens.length === 2 ? "flex-1" : "mb-2"}>
                <TokenSlot
                  token={token}
                  isOpen={isOpen}
                  onPress={() => handleTokenSelect(token.id)}
                  selected={selectedTokenId === token.id}
                  userBet={userBets.find((b) => b.tokenId === token.id)}
                />
              </View>
            ))}
          </View>
        </AnimatedEntry>

        {/* Token detail panel */}
        {selectedToken && (
          <TokenDetail
            token={selectedToken}
            isOpen={isOpen}
            onBet={(side) => handleBet(selectedToken, side)}
            userBet={userBets.find((b) => b.tokenId === selectedToken.id)}
          />
        )}

        {/* Price details for all tokens */}
        <AnimatedEntry index={5}>
          <Text className="text-white/40 font-mono text-xs mb-2 mt-4 uppercase">
            Price Details
          </Text>
        </AnimatedEntry>
        {currentRound.tokens.map((token, i) => (
          <AnimatedEntry key={`detail-${token.id}`} index={i + 6}>
            <GlowCard className="p-3 mb-2" borderColor={Colors.dark300 + "30"}>
              <Text className="text-white font-bold font-mono text-sm mb-2">
                {token.ticker} Details
              </Text>
              <View className="flex-row gap-4">
                <View>
                  <Text className="text-white/40 font-mono text-[10px]">
                    OPEN PRICE
                  </Text>
                  <Text className="text-white font-mono text-sm">
                    $
                    {token.priceAtOpen < 0.01
                      ? token.priceAtOpen.toFixed(6)
                      : token.priceAtOpen.toFixed(4)}
                  </Text>
                </View>
                {token.priceAtClose !== undefined && (
                  <View>
                    <Text className="text-white/40 font-mono text-[10px]">
                      CLOSE PRICE
                    </Text>
                    <Text className="text-white font-mono text-sm">
                      $
                      {token.priceAtClose < 0.01
                        ? token.priceAtClose.toFixed(6)
                        : token.priceAtClose.toFixed(4)}
                    </Text>
                  </View>
                )}
                {token.liquidity !== undefined && (
                  <View>
                    <Text className="text-white/40 font-mono text-[10px]">
                      LIQUIDITY
                    </Text>
                    <Text className="text-white font-mono text-sm">
                      ${(token.liquidity / 1000).toFixed(0)}K
                    </Text>
                  </View>
                )}
              </View>
            </GlowCard>
          </AnimatedEntry>
        ))}

        {/* Your bets */}
        {userBets.length > 0 && (
          <AnimatedEntry index={9}>
            <View className="mt-4 mb-8">
              <Text className="text-white/40 font-mono text-xs mb-2 uppercase">
                Your Bets
              </Text>
              {userBets.map((bet) => (
                <GlowCard
                  key={bet.id}
                  borderColor={Colors.dark300 + "30"}
                  className="flex-row items-center justify-between p-3 mb-1.5"
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name={bet.side === "pump" ? "arrow-up" : "arrow-down"}
                      size={16}
                      color={bet.side === "pump" ? Colors.pump : Colors.rug}
                    />
                    <Text className="text-white font-mono font-bold text-sm">
                      {bet.tokenTicker}
                    </Text>
                    <Text className="text-white/40 font-mono text-xs">
                      {bet.amount} SOL
                    </Text>
                  </View>
                  <View className="items-end">
                    {!bet.result && currentRound && (
                      <ResolveCountdown settlesAt={currentRound.closesAt + 65_000} />
                    )}
                    {bet.result && (
                      <Text
                        className="font-mono font-bold text-sm"
                        style={{
                          color:
                            (bet.payout ?? 0) > bet.amount
                              ? Colors.pump
                              : (bet.payout ?? 0) === bet.amount
                              ? Colors.whiteDim
                              : Colors.rug,
                        }}
                      >
                        {(bet.payout ?? 0) > bet.amount ? "+" : ""}
                        {((bet.payout ?? 0) - bet.amount).toFixed(2)} SOL
                      </Text>
                    )}
                    {bet.result && (bet.payout ?? 0) > 0 && !bet.claimed && signAndSend && (
                      <Pressable
                        onPress={async () => {
                          try {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            await claimBet(bet, signAndSend);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          } catch {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                          }
                        }}
                        disabled={claiming === bet.id}
                        style={{ marginTop: 4 }}
                      >
                        <View
                          className="rounded-md px-3 py-1"
                          style={{ backgroundColor: Colors.pump }}
                        >
                          {claiming === bet.id ? (
                            <ActivityIndicator size="small" color={Colors.dark} />
                          ) : (
                            <Text className="font-bold font-mono text-[10px]" style={{ color: Colors.dark }}>
                              Claim
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    )}
                    {bet.claimed && (
                      <Text className="font-mono text-[10px] mt-1" style={{ color: Colors.pump + "80" }}>
                        Claimed
                      </Text>
                    )}
                  </View>
                </GlowCard>
              ))}
            </View>
          </AnimatedEntry>
        )}

        <View className="h-8" />
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
        }}
      />
    </SafeAreaView>
  );
}
