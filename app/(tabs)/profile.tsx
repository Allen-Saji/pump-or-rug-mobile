import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Colors, Gradients, Glows } from "@/constants/theme";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useSolanaSignAndSend } from "@/lib/solana";
import { GlowCard } from "@/components/GlowCard";
import { AnimatedEntry } from "@/components/AnimatedEntry";
import { ResultBadge } from "@/components/ResultBadge";

export default function ProfileScreen() {
  const { userBets, loadUserBets, claimBet, claiming } = useStore();
  const signAndSend = useSolanaSignAndSend();
  const [claimError, setClaimError] = useState<string | null>(null);
  const { authenticated, user, walletAddress, truncatedAddress, logout } =
    useAuth();

  // Load bets when authenticated
  useEffect(() => {
    if (authenticated) loadUserBets();
  }, [authenticated]);

  // Guest view — prompt to log in
  if (!authenticated) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: Colors.dark }}
      >
        <View className="flex-1 items-center justify-center px-6">
          <AnimatedEntry>
            <View className="items-center">
              <LinearGradient
                colors={[Colors.pump + "30", Colors.dark100]}
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
              >
                <Ionicons name="person" size={32} color={Colors.whiteDim} />
              </LinearGradient>
              <Text className="text-white font-bold font-mono text-lg mb-2">
                Not signed in
              </Text>
              <Text className="text-white/40 font-mono text-sm text-center mb-6">
                Sign in to track your bets, stats, and climb the leaderboard
              </Text>
              <Pressable onPress={() => router.push("/login")}>
                <LinearGradient
                  colors={Gradients.pumpButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-xl px-8 py-3"
                  style={Glows.pumpSubtle}
                >
                  <Text className="text-dark font-bold font-mono text-base">
                    Sign In
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </AnimatedEntry>
        </View>
      </SafeAreaView>
    );
  }

  // Derive display name from Privy user linked accounts
  const googleAccount = user?.linked_accounts?.find(
    (a) => a.type === "google_oauth"
  );
  const twitterAccount = user?.linked_accounts?.find(
    (a) => a.type === "twitter_oauth"
  );
  const displayName =
    (googleAccount && "name" in googleAccount ? googleAccount.name : null) ??
    (twitterAccount && "username" in twitterAccount
      ? twitterAccount.username
      : null) ??
    truncatedAddress ??
    "Anon";

  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.dark }}>
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
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
                  {initials}
                </Text>
              </View>
            </LinearGradient>

            <Text className="text-white font-bold font-mono text-lg">
              {displayName}
            </Text>

            {/* Wallet address */}
            {walletAddress && (
              <View
                className="flex-row items-center gap-1.5 mt-1 px-3 py-1 rounded-full"
                style={{ backgroundColor: Colors.dark200 }}
              >
                <Ionicons name="wallet" size={12} color={Colors.pump} />
                <Text
                  className="font-mono text-xs"
                  style={{ color: Colors.pump }}
                >
                  {truncatedAddress}
                </Text>
              </View>
            )}
          </View>
        </AnimatedEntry>

        {/* Bet history */}
        {userBets.length > 0 && (
          <AnimatedEntry index={1}>
            <View className="mt-2 mb-8">
              <Text className="text-white/40 font-mono text-xs mb-2 uppercase">
                Bet History
              </Text>
              {userBets.map((bet, i) => (
                <GlowCard
                  key={`${bet.id}-${i}`}
                  borderColor={Colors.dark300 + "30"}
                  className="flex-row items-center justify-between p-3 mb-1.5"
                >
                  <View className="flex-row items-center gap-3">
                    <LinearGradient
                      colors={[
                        (bet.side === "pump" ? Colors.pump : Colors.rug) +
                          "30",
                        (bet.side === "pump" ? Colors.pump : Colors.rug) +
                          "10",
                      ]}
                      className="w-8 h-8 rounded-full items-center justify-center"
                    >
                      <Ionicons
                        name={
                          bet.side === "pump" ? "arrow-up" : "arrow-down"
                        }
                        size={16}
                        color={
                          bet.side === "pump" ? Colors.pump : Colors.rug
                        }
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
                                : (bet.payout ?? 0) === bet.amount
                                ? Colors.whiteDim
                                : Colors.rug,
                          }}
                        >
                          {(bet.payout ?? 0) > bet.amount ? "+" : ""}
                          {((bet.payout ?? 0) - bet.amount).toFixed(2)} SOL
                        </Text>
                        {/* Claim button */}
                        {(bet.payout ?? 0) > 0 && !bet.claimed && signAndSend && (
                          <Pressable
                            onPress={async () => {
                              setClaimError(null);
                              try {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                await claimBet(bet, signAndSend);
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              } catch (err: any) {
                                setClaimError(err?.message ?? "Claim failed");
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                              }
                            }}
                            disabled={claiming === bet.id}
                            style={{ marginTop: 4 }}
                          >
                            <LinearGradient
                              colors={Gradients.pumpButton}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              className="rounded-md px-3 py-1"
                            >
                              {claiming === bet.id ? (
                                <ActivityIndicator size="small" color={Colors.dark} />
                              ) : (
                                <Text className="font-bold font-mono text-[10px]" style={{ color: Colors.dark }}>
                                  Claim
                                </Text>
                              )}
                            </LinearGradient>
                          </Pressable>
                        )}
                        {bet.claimed && (
                          <Text className="font-mono text-[10px] mt-1" style={{ color: Colors.pump + "80" }}>
                            Claimed
                          </Text>
                        )}
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
        )}

        {/* Logout */}
        <AnimatedEntry index={2}>
          <View className="mb-12">
            <Pressable
              onPress={logout}
              className="items-center py-3"
            >
              <Text className="text-rug font-mono text-sm font-bold">
                Sign Out
              </Text>
            </Pressable>
          </View>
        </AnimatedEntry>
      </ScrollView>
    </SafeAreaView>
  );
}
