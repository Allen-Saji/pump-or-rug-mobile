import { View, type ViewStyle } from "react-native";
import { Colors } from "@/constants/theme";

interface GlowCardProps {
  children: React.ReactNode;
  glowColor?: string;
  gradient?: unknown;
  borderColor?: string;
  style?: ViewStyle;
  className?: string;
}

export function GlowCard({
  children,
  borderColor,
  style,
  className = "",
}: GlowCardProps) {
  return (
    <View
      className={`rounded-2xl overflow-hidden ${className}`}
      style={[
        {
          backgroundColor: Colors.dark100,
          borderWidth: 1,
          borderColor: borderColor ?? Colors.dark300,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
