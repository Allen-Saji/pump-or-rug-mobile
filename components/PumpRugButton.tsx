import { Pressable, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/theme";
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

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
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
          backgroundColor: disabled ? Colors.dark300 : color,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: compact ? 12 : 20,
          paddingVertical: compact ? 8 : 12,
        },
        animatedStyle,
      ]}
    >
      <Text
        className="font-bold font-mono"
        style={{
          color: disabled ? Colors.dark400 : isPump ? Colors.dark : Colors.white,
          fontSize: compact ? 13 : 16,
        }}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}
