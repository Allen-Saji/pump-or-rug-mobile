import { View } from "react-native";
import { GlowCard } from "./GlowCard";
import { ShimmerLoader } from "./ShimmerLoader";

export function SkeletonRoundDetail() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      {/* Pool stats */}
      <GlowCard className="flex-row p-3 mb-4 mt-3 gap-4">
        <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
          <ShimmerLoader width={30} height={10} borderRadius={4} />
          <ShimmerLoader width={60} height={16} borderRadius={4} />
        </View>
        <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
          <ShimmerLoader width={30} height={10} borderRadius={4} />
          <ShimmerLoader width={40} height={16} borderRadius={4} />
        </View>
      </GlowCard>

      {/* Token label */}
      <ShimmerLoader width={60} height={12} borderRadius={4} style={{ marginBottom: 8 }} />

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
    </View>
  );
}
