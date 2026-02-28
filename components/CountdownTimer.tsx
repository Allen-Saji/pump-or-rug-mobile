import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  type SharedValue,
} from "react-native-reanimated";
import { Colors } from "@/constants/theme";

interface CountdownTimerProps {
  targetTime: number;
  label?: string;
  onComplete?: () => void;
}

export function CountdownTimer({
  targetTime,
  label,
  onComplete,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(getRemainingTime(targetTime));
  const urgentPulse = useSharedValue(0);
  const digitScale = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      const r = getRemainingTime(targetTime);
      setRemaining(r);
      digitScale.value = withSequence(
        withTiming(1.08, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );
      if (r.total <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const isUrgent = remaining.total > 0 && remaining.total < 60_000;

  useEffect(() => {
    if (isUrgent) {
      urgentPulse.value = withRepeat(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      urgentPulse.value = 0;
    }
  }, [isUrgent]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: digitScale.value }],
  }));

  return (
    <View style={{ alignItems: "center" }}>
      {label && (
        <Text className="text-white/50 text-xs mb-1 font-mono">{label}</Text>
      )}
      <Animated.View
        style={[
          { flexDirection: "row", alignItems: "center", gap: 4 },
          scaleStyle,
        ]}
      >
        <TimeBlock value={remaining.minutes} isUrgent={isUrgent} urgentPulse={urgentPulse} />
        <Text
          style={{
            color: isUrgent ? Colors.rug : Colors.white,
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          :
        </Text>
        <TimeBlock value={remaining.seconds} isUrgent={isUrgent} urgentPulse={urgentPulse} />
      </Animated.View>
    </View>
  );
}

function TimeBlock({
  value,
  isUrgent,
  urgentPulse,
}: {
  value: number;
  isUrgent: boolean;
  urgentPulse: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: isUrgent
      ? `rgba(255, 51, 102, ${interpolate(urgentPulse.value, [0, 1], [0.15, 0.35])})`
      : Colors.dark200,
  }));

  return (
    <Animated.View
      style={[
        {
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 4,
          minWidth: 36,
          alignItems: "center",
        },
        animatedStyle,
      ]}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          fontFamily: "SpaceMono",
          color: isUrgent ? Colors.rug : Colors.white,
        }}
      >
        {String(value).padStart(2, "0")}
      </Text>
    </Animated.View>
  );
}

function getRemainingTime(target: number) {
  const total = Math.max(0, target - Date.now());
  return {
    total,
    minutes: Math.floor(total / 60_000),
    seconds: Math.floor((total % 60_000) / 1000),
  };
}
