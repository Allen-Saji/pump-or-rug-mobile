import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors, Gradients, Glows } from "@/constants/theme";
import type { BetSide } from "@/lib/types";

interface PumpRugButtonProps {
  side: BetSide;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PumpRugButton({
  side,
  onPress,
  disabled,
  compact,
}: PumpRugButtonProps) {
  const isPump = side === "pump";
  const color = isPump ? Colors.pump : Colors.rug;
  const label = isPump ? "PUMP" : "RUG";
  const gradientColors = isPump ? Gradients.pumpButton : Gradients.rugButton;
  const glow = isPump ? Glows.pumpSubtle : Glows.rugSubtle;

  const scale = useSharedValue(1);
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    if (!disabled) {
      glowPulse.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [disabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: interpolate(glowPulse.value, [0, 1], [0.2, 0.5]),
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        {
          borderRadius: 10,
          overflow: "hidden",
          opacity: disabled ? 0.4 : 1,
          ...glow,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={
          disabled
            ? [Colors.dark300, Colors.dark200]
            : gradientColors
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="items-center justify-center"
        style={{
          paddingHorizontal: compact ? 12 : 20,
          paddingVertical: compact ? 8 : 12,
        }}
      >
        <Text
          className="font-bold font-mono"
          style={{
            color: disabled ? Colors.dark300 : isPump ? Colors.dark : Colors.white,
            fontSize: compact ? 13 : 16,
          }}
        >
          {label}
        </Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}
