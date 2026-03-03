import { useState, useCallback } from "react";
import { View, Text, Pressable, Modal, TouchableOpacity } from "react-native";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import { router } from "expo-router";
import { Colors, Gradients, Glows } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import type { BetSide, Token } from "@/lib/types";

interface BetSheetProps {
  visible: boolean;
  token: Token | null;
  side: BetSide | null;
  onConfirm: (amount: number) => void;
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

  const handleConfirm = useCallback(() => {
    if (!authenticated) {
      onClose();
      router.push("/login");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      onConfirm(amount);
    }, 1500);
  }, [amount, onConfirm, authenticated, onClose]);

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
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: color + "20" }}
              >
                <Text className="font-bold font-mono" style={{ color }}>
                  {isPump ? "P" : "R"}
                </Text>
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

            {/* Amount display */}
            <Text className="text-white text-center font-bold font-mono text-2xl mb-4">
              {amount.toFixed(2)}{" "}
              <Text className="text-white/50 text-base">SOL</Text>
            </Text>

            {/* Confirm */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirm}
              style={{ borderRadius: 14, overflow: "hidden", ...glow }}
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
                <Text className="font-bold font-mono text-lg" style={{ color: isPump ? Colors.dark : Colors.white }}>
                  Confirm {isPump ? "PUMP" : "RUG"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}
