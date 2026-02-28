import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import LottieView from "lottie-react-native";
import { Colors } from "@/constants/theme";

interface StreakBannerProps {
  winStreak: number;
  dailyStreak: number;
}

export function StreakBanner({ winStreak, dailyStreak }: StreakBannerProps) {
  const showFire = winStreak >= 3;

  return (
    <View className="flex-row gap-3">
      <LinearGradient
        colors={[Colors.rug + "20", Colors.rug + "08"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 rounded-xl p-3 flex-row items-center gap-2"
        style={{
          borderWidth: 1,
          borderColor: Colors.rug + "30",
        }}
      >
        {showFire ? (
          <LottieView
            source={require("@/assets/animations/streak-fire.json")}
            autoPlay
            loop
            style={{ width: 32, height: 32 }}
          />
        ) : (
          <Ionicons name="flame" size={24} color={Colors.rug} />
        )}
        <View>
          <Text className="text-white font-bold font-mono text-xl">
            {winStreak}
          </Text>
          <Text className="text-white/50 text-[10px] font-mono">
            WIN STREAK
          </Text>
        </View>
      </LinearGradient>

      <LinearGradient
        colors={[Colors.pump + "20", Colors.pump + "08"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 rounded-xl p-3 flex-row items-center gap-2"
        style={{
          borderWidth: 1,
          borderColor: Colors.pump + "30",
        }}
      >
        <Ionicons name="calendar" size={24} color={Colors.pump} />
        <View>
          <Text className="text-white font-bold font-mono text-xl">
            {dailyStreak}
          </Text>
          <Text className="text-white/50 text-[10px] font-mono">
            DAILY STREAK
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
