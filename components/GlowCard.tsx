import { type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradients, type GradientColors } from "@/constants/theme";

interface GlowCardProps {
  children: React.ReactNode;
  glowColor?: string;
  gradient?: GradientColors;
  borderColor?: string;
  style?: ViewStyle;
  className?: string;
}

export function GlowCard({
  children,
  glowColor,
  gradient,
  borderColor,
  style,
  className = "",
}: GlowCardProps) {
  return (
    <LinearGradient
      colors={gradient ?? Gradients.cardBg}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={`rounded-2xl overflow-hidden ${className}`}
      style={[
        {
          borderWidth: borderColor ? 1 : 0,
          borderColor: borderColor ?? "transparent",
          ...(glowColor
            ? {
                shadowColor: glowColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }
            : {}),
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}
