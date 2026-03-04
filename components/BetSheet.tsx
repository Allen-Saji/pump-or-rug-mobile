import { useState, useCallback } from "react";
import { View, Text, Pressable, Modal, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import { router } from "expo-router";
import { Colors, Gradients, Glows } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { proxyImageUrl } from "@/lib/utils";
import type { BetSide, Token } from "@/lib/types";

interface BetSheetProps {
  visible: boolean;
  token: Token | null;
  side: BetSide | null;
  onConfirm: (amount: number) => Promise<void>;
  onClose: () => void;
}

const STAKES = [0.1, 0.25, 0.5, 1.0];

export function BetSheet({
  visible,
  token,
  side,
  onConfirm,
  onClose,
}: BetSheetProps) {
  const [amount, setAmount] = useState(0.1);
  const [activeStake, setActiveStake] = useState<number | null>(0.1);
  const [confirmed, setConfirmed] = useState(false);
  const { authenticated } = useAuth();
  const isPump = side === "pump";
  const color = isPump ? Colors.pump : Colors.rug;
  const glow = isPump ? Glows.pump : Glows.rug;
  const insets = useSafeAreaInsets();

  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (!authenticated) {
      onClose();
      router.push("/login");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(amount);
      // Only show celebration after successful bet (including on-chain signing)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfirmed(true);
      setTimeout(() => {
        setConfirmed(false);
        handleClose();
      }, 1500);
    } catch {
      // Error toasts are handled by the store
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  }, [amount, onConfirm, authenticated, onClose, submitting]);

  const handleClose = () => {
    setConfirmed(false);
    setActiveStake(0.1);
    setAmount(0.1);
    onClose();
  };

  if (!token || !side) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
        {/* Celebration overlay — full screen centered */}
        {confirmed && (
          <Animated.View
            entering={FadeIn}
            className="absolute inset-0 items-center justify-center z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          >
            <LottieView
              source={require("@/assets/animations/bet-confirmed.json")}
              autoPlay
              loop={false}
              style={{ width: 180, height: 180 }}
            />
            <Text className="text-white font-bold font-mono text-xl mt-2">
              Bet Placed!
            </Text>
          </Animated.View>
        )}

        {/* Backdrop dismiss */}
        <Pressable className="flex-1" onPress={handleClose} />

        {/* Sheet */}
        <LinearGradient
          colors={Gradients.sheetBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          className="rounded-t-3xl"
          style={{ paddingBottom: Math.max(insets.bottom, 32) + 16 }}
        >
          <View className="p-5">
            {/* Handle */}
            <View className="w-10 h-1 rounded-full self-center mb-3" style={{ backgroundColor: Colors.dark300 }} />

            {/* Header */}
            <View className="flex-row items-center gap-3 mb-4">
              <View
                className="w-10 h-10 rounded-full items-center justify-center overflow-hidden"
                style={{ backgroundColor: color + "20" }}
              >
                {token.imageUrl ? (
                  <Image
                    source={{ uri: proxyImageUrl(token.imageUrl) }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="font-bold font-mono" style={{ color }}>
                    {isPump ? "P" : "R"}
                  </Text>
                )}
              </View>
              <View>
                <Text className="text-white font-bold font-mono text-lg">
                  {isPump ? "PUMP" : "RUG"} {token.ticker}
                </Text>
                <Text className="text-white/50 text-xs font-mono">
                  {token.platform}
                </Text>
              </View>
            </View>

            {/* Quick stake buttons */}
            <View className="flex-row gap-2 mb-3">
              {STAKES.map((s) => {
                const isActive = activeStake === s;
                return (
                  <TouchableOpacity
                    key={s}
                    activeOpacity={0.7}
                    onPress={() => {
                      setAmount(s);
                      setActiveStake(s);
                      Haptics.selectionAsync();
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      alignItems: "center",
                      backgroundColor: isActive ? color + "20" : Colors.dark200,
                      borderWidth: isActive ? 1 : 1,
                      borderColor: isActive ? color : "transparent",
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      className="font-bold font-mono text-sm"
                      style={{
                        color: isActive ? color : Colors.whiteDim,
                      }}
                    >
                      {s} SOL
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Slider */}
            <View className="mb-1">
              <Slider
                value={amount}
                onSlidingStart={() => setActiveStake(null)}
                onValueChange={(v: number) =>
                  setAmount(Math.round(v * 100) / 100)
                }
                minimumValue={0.01}
                maximumValue={1}
                step={0.01}
                minimumTrackTintColor={color}
                maximumTrackTintColor={Colors.dark300}
                thumbTintColor={color}
              />
            </View>

            {/* Amount + estimated payout */}
            <Text className="text-white text-center font-bold font-mono text-2xl mb-1">
              {amount.toFixed(2)}{" "}
              <Text className="text-white/50 text-base">SOL</Text>
            </Text>
            {(() => {
              const myPool = isPump ? (token.pumpPool ?? 0) : (token.rugPool ?? 0);
              const otherPool = isPump ? (token.rugPool ?? 0) : (token.pumpPool ?? 0);
              const totalAfter = myPool + amount + otherPool;
              const myShareAfter = myPool + amount;
              if (totalAfter > 0 && otherPool > 0) {
                const estPayout = (amount / myShareAfter) * totalAfter * 0.95;
                const mult = estPayout / amount;
                return (
                  <Text className="text-center font-mono text-xs mb-4" style={{ color: Colors.whiteDim }}>
                    Est. payout:{" "}
                    <Text style={{ color }}>
                      {estPayout.toFixed(2)} SOL ({mult.toFixed(2)}x)
                    </Text>
                  </Text>
                );
              }
              return (
                <Text className="text-center font-mono text-xs mb-4" style={{ color: Colors.whiteDim }}>
                  First bet on this side — odds depend on opposing pool
                </Text>
              );
            })()}

            {/* Confirm */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirm}
              disabled={submitting}
              style={{ borderRadius: 14, overflow: "hidden", opacity: submitting ? 0.6 : 1, ...glow }}
            >
              <LinearGradient
                colors={
                  isPump
                    ? Gradients.pumpButton
                    : Gradients.rugButton
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-3.5 items-center"
              >
                {submitting ? (
                  <ActivityIndicator color={isPump ? Colors.dark : Colors.white} />
                ) : (
                  <Text className="font-bold font-mono text-lg" style={{ color: isPump ? Colors.dark : Colors.white }}>
                    Confirm {isPump ? "PUMP" : "RUG"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}
