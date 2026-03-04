import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Clipboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/theme";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useWallet } from "@/lib/wallet";
import { useSolanaSignAndSend } from "@/lib/solana";
import { GlowCard } from "@/components/GlowCard";
import { AnimatedEntry } from "@/components/AnimatedEntry";
import { ResultBadge } from "@/components/ResultBadge";

export default function ProfileScreen() {
  const { userBets, loadUserBets, claimBet, claiming } = useStore();
  const signAndSend = useSolanaSignAndSend();
  const [claimError, setClaimError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { authenticated, user, walletAddress, truncatedAddress, logout } =
    useAuth();
  const { solBalance, refreshBalance } = useWallet();

  useEffect(() => {
    if (authenticated) loadUserBets();
  }, [authenticated]);

  const handleCopyAddress = () => {
    if (!walletAddress) return;
    Clipboard.setString(walletAddress);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Guest view
  if (!authenticated) {
    return (
      <SafeAreaView
        className="flex-1"
        edges={["top"]}
        style={{ backgroundColor: Colors.dark }}
      >
        <View className="flex-1 items-center justify-center px-6">
          <AnimatedEntry>
            <View className="items-center">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: Colors.dark200 }}
              >
                <Ionicons name="person" size={32} color={Colors.whiteDim} />
              </View>
              <Text className="text-white font-bold font-mono text-lg mb-2">
                Not signed in
              </Text>
              <Text style={{ color: Colors.whiteDim }} className="font-mono text-sm text-center mb-6">
                Sign in to track your bets, stats, and climb the leaderboard
              </Text>
              <Pressable
                onPress={() => router.push("/login")}
                style={{
                  backgroundColor: Colors.pump,
                  borderRadius: 12,
                  paddingHorizontal: 32,
                  paddingVertical: 12,
                }}
              >
                <Text className="font-bold font-mono text-base" style={{ color: Colors.dark }}>
                  Sign In
                </Text>
              </Pressable>
            </View>
          </AnimatedEntry>
        </View>
      </SafeAreaView>
    );
  }

  // Derive display name
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
    <SafeAreaView className="flex-1" edges={["top"]} style={{ backgroundColor: Colors.dark }}>
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AnimatedEntry>
          <View className="items-center pt-4 pb-6">
            {/* Avatar with solid green ring */}
            <View
              className="w-[84px] h-[84px] rounded-full items-center justify-center mb-3"
              style={{
                borderWidth: 2,
                borderColor: Colors.pump,
              }}
            >
              <View
                className="w-20 h-20 rounded-full items-center justify-center"
                style={{ backgroundColor: Colors.dark }}
              >
                <Text className="text-pump font-bold font-mono text-2xl">
                  {initials}
                </Text>
              </View>
            </View>

            <Text className="text-white font-bold font-mono text-lg">
              {displayName}
            </Text>

            {/* Wallet address with copy button */}
            {walletAddress && (
              <Pressable onPress={handleCopyAddress}>
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
                  <Ionicons
                    name={copied ? "checkmark" : "copy-outline"}
                    size={12}
                    color={copied ? Colors.pump : Colors.whiteDim}
                  />
                </View>
              </Pressable>
            )}
          </View>
        </AnimatedEntry>

        {/* Wallet section */}
        {walletAddress && (
          <AnimatedEntry index={1}>
            <View className="mb-4">
              <Text style={{ color: Colors.whiteDim }} className="font-mono text-xs mb-2 uppercase">
                Wallet
              </Text>
              <GlowCard borderColor={Colors.dark300} className="p-3">
                {/* Balance */}
                <View className="flex-row items-center justify-between mb-3">
                  <Text style={{ color: Colors.whiteDim }} className="font-mono text-xs">
                    Balance
                  </Text>
                  <Pressable onPress={refreshBalance} className="flex-row items-center gap-1.5">
                    <Text className="font-mono text-base font-bold" style={{ color: Colors.white }}>
                      {solBalance !== null ? `${solBalance.toFixed(4)} SOL` : "—"}
                    </Text>
                    <Ionicons name="refresh-outline" size={12} color={Colors.whiteDim} />
                  </Pressable>
                </View>

                <Text style={{ color: Colors.whiteDim }} className="font-mono text-xs mb-2">
                  Send SOL to this address to fund your bets
                </Text>
                <Pressable onPress={handleCopyAddress}>
                  <View
                    className="flex-row items-center justify-between rounded-lg py-2.5 px-3"
                    style={{ backgroundColor: Colors.dark200 }}
                  >
                    <Text
                      className="font-mono text-xs flex-1 mr-2"
                      style={{ color: Colors.white }}
                      numberOfLines={1}
                    >
                      {walletAddress}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Ionicons
                        name={copied ? "checkmark-circle" : "copy-outline"}
                        size={16}
                        color={copied ? Colors.pump : Colors.whiteDim}
                      />
                      <Text
                        className="font-mono text-xs font-bold"
                        style={{ color: copied ? Colors.pump : Colors.whiteDim }}
                      >
                        {copied ? "Copied!" : "Copy"}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </GlowCard>
            </View>
          </AnimatedEntry>
        )}

        {/* Bet history */}
        {userBets.length > 0 && (
          <AnimatedEntry index={2}>
            <View className="mt-2 mb-8">
              <Text style={{ color: Colors.whiteDim }} className="font-mono text-xs mb-2 uppercase">
                Bet History
              </Text>
              {userBets.map((bet, i) => (
                <GlowCard
                  key={`${bet.id}-${i}`}
                  borderColor={Colors.dark300}
                  className="flex-row items-center justify-between p-3 mb-1.5"
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center"
                      style={{
                        backgroundColor:
                          (bet.side === "pump" ? Colors.pump : Colors.rug) + "15",
                      }}
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
                    </View>
                    <View>
                      <Text className="text-white font-mono font-bold text-sm">
                        {bet.tokenTicker}
                      </Text>
                      <Text style={{ color: Colors.whiteDim }} className="font-mono text-[10px]">
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
                            style={{
                              marginTop: 4,
                              backgroundColor: Colors.pump,
                              borderRadius: 6,
                              paddingHorizontal: 12,
                              paddingVertical: 4,
                            }}
                          >
                            {claiming === bet.id ? (
                              <ActivityIndicator size="small" color={Colors.dark} />
                            ) : (
                              <Text className="font-bold font-mono text-[10px]" style={{ color: Colors.dark }}>
                                Claim
                              </Text>
                            )}
                          </Pressable>
                        )}
                        {bet.claimed && (
                          <Text className="font-mono text-[10px] mt-1" style={{ color: Colors.pump + "80" }}>
                            Claimed
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text style={{ color: Colors.whiteDim }} className="font-mono text-xs">
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
        <AnimatedEntry index={3}>
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
