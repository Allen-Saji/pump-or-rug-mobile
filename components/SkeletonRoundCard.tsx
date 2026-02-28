import { View } from "react-native";
import { GlowCard } from "./GlowCard";
import { ShimmerLoader } from "./ShimmerLoader";

export function SkeletonRoundCard() {
  return (
    <GlowCard className="p-4 mb-4">
      {/* Header row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <ShimmerLoader width={140} height={22} borderRadius={6} />
        <ShimmerLoader width={80} height={22} borderRadius={6} />
      </View>
      {/* Pool info */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
        <ShimmerLoader width={90} height={14} borderRadius={4} />
        <ShimmerLoader width={60} height={14} borderRadius={4} />
      </View>
      {/* Token slots */}
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            backgroundColor: "#2A2A2A",
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <ShimmerLoader width={36} height={36} borderRadius={18} />
            <View style={{ flex: 1, gap: 4 }}>
              <ShimmerLoader width={80} height={16} borderRadius={4} />
              <ShimmerLoader width={50} height={12} borderRadius={4} />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <ShimmerLoader width="48%" height={36} borderRadius={10} />
            <ShimmerLoader width="48%" height={36} borderRadius={10} />
          </View>
        </View>
      ))}
    </GlowCard>
  );
}
