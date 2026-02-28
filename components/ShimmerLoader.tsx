import { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/theme";

interface ShimmerLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function ShimmerLoader({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: ShimmerLoaderProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: Colors.dark200,
          overflow: "hidden",
        },
        animatedStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={[Colors.dark200, Colors.dark300, Colors.dark200]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}
