import { View } from "react-native";
import { GlowCard } from "./GlowCard";
import { ShimmerLoader } from "./ShimmerLoader";
import { Colors } from "@/constants/theme";

export function SkeletonProfile() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      {/* Avatar + name */}
      <View style={{ alignItems: "center", paddingTop: 16, paddingBottom: 24 }}>
        <ShimmerLoader width={84} height={84} borderRadius={42} style={{ marginBottom: 12 }} />
        <ShimmerLoader width={120} height={18} borderRadius={6} style={{ marginBottom: 8 }} />
        <ShimmerLoader width={160} height={24} borderRadius={12} />
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {[0, 1, 2].map((i) => (
          <GlowCard key={i} className="flex-1 p-3 items-center">
            <ShimmerLoader width={18} height={18} borderRadius={9} style={{ marginBottom: 4 }} />
            <ShimmerLoader width={40} height={20} borderRadius={4} style={{ marginBottom: 4 }} />
            <ShimmerLoader width={50} height={10} borderRadius={4} />
          </GlowCard>
        ))}
      </View>

      {/* Streak banner */}
      <ShimmerLoader width="100%" height={56} borderRadius={12} style={{ marginBottom: 24 }} />

      {/* Badges */}
      <ShimmerLoader width={60} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <ShimmerLoader width={120} height={40} borderRadius={8} />
        <ShimmerLoader width={100} height={40} borderRadius={8} />
      </View>
    </View>
  );
}
