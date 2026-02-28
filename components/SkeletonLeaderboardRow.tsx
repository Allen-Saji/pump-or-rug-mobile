import { View } from "react-native";
import { ShimmerLoader } from "./ShimmerLoader";
import { Colors } from "@/constants/theme";

export function SkeletonLeaderboardRow() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.dark100,
        borderRadius: 12,
        marginBottom: 6,
      }}
    >
      <ShimmerLoader width={24} height={24} borderRadius={12} style={{ marginRight: 12 }} />
      <ShimmerLoader width={32} height={32} borderRadius={16} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <ShimmerLoader width={120} height={14} borderRadius={4} />
      </View>
      <ShimmerLoader width={50} height={14} borderRadius={4} />
    </View>
  );
}
