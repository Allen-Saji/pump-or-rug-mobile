import Animated, { FadeInDown } from "react-native-reanimated";

interface AnimatedEntryProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  className?: string;
}

export function AnimatedEntry({
  children,
  index = 0,
  delay = 80,
  className = "",
}: AnimatedEntryProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * delay)
        .duration(400)
        .springify()
        .damping(18)}
      className={className}
    >
      {children}
    </Animated.View>
  );
}
