import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { Colors } from "@/constants/theme";
import { useToast, type ToastType } from "@/lib/toast";

const COLORS: Record<ToastType, string> = {
  error: Colors.rug,
  success: Colors.pump,
  info: Colors.whiteDim,
};

export function ToastOverlay() {
  const { toasts, dismiss } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      className="absolute left-4 right-4 z-50"
      style={{ top: insets.top + 8 }}
      pointerEvents="box-none"
    >
      {toasts.map((t) => (
        <Animated.View
          key={t.id}
          entering={FadeInUp.duration(200)}
          exiting={FadeOutUp.duration(200)}
        >
          <Pressable
            onPress={() => dismiss(t.id)}
            className="rounded-xl px-4 py-3 mb-2"
            style={{
              backgroundColor: Colors.dark100,
              borderWidth: 1,
              borderColor: COLORS[t.type] + "40",
            }}
          >
            <Text
              className="font-mono text-sm"
              style={{ color: COLORS[t.type] }}
            >
              {t.message}
            </Text>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}
