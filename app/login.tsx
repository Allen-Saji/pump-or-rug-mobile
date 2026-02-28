import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors, Gradients, Glows } from "@/constants/theme";
import { GlowCard } from "@/components/GlowCard";
import { AnimatedEntry } from "@/components/AnimatedEntry";
import { useAuth } from "@/lib/auth";

type LoginProvider = "google" | "twitter";

export default function LoginScreen() {
  const { login, oauthLoading, authenticated } = useAuth();
  const [activeProvider, setActiveProvider] = useState<LoginProvider | null>(null);

  // If already authenticated, navigate to home
  if (authenticated) {
    router.replace("/");
    return null;
  }

  const handleLogin = async (provider: LoginProvider) => {
    setActiveProvider(provider);
    try {
      await login(provider);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    } catch (e) {
      console.error("OAuth login failed:", e);
    } finally {
      setActiveProvider(null);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.dark }}>
      <View className="flex-1 px-6 justify-center">
        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          className="absolute top-4 left-4 z-10 p-2"
        >
          <Ionicons name="close" size={24} color={Colors.whiteDim} />
        </Pressable>

        {/* Logo / Title */}
        <AnimatedEntry>
          <View className="items-center mb-10">
            <View className="flex-row items-center gap-2 mb-3">
              <Text
                className="text-pump font-bold font-mono text-3xl"
                style={{
                  textShadowColor: Colors.pump + "60",
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 16,
                }}
              >
                PUMP
              </Text>
              <Text className="text-white/30 font-mono text-3xl">or</Text>
              <Text
                className="text-rug font-bold font-mono text-3xl"
                style={{
                  textShadowColor: Colors.rug + "60",
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 16,
                }}
              >
                RUG
              </Text>
            </View>
            <Text className="text-white/40 font-mono text-sm text-center">
              Sign in to place bets and track your stats
            </Text>
          </View>
        </AnimatedEntry>

        {/* Login buttons */}
        <AnimatedEntry index={1}>
          <View className="gap-3">
            {/* Google */}
            <Pressable
              onPress={() => handleLogin("google")}
              disabled={!!activeProvider}
            >
              <GlowCard
                glowColor={Colors.pump + "30"}
                className="flex-row items-center justify-center gap-3 py-4 px-6"
              >
                {activeProvider === "google" ? (
                  <ActivityIndicator color={Colors.pump} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color={Colors.white} />
                    <Text className="text-white font-bold font-mono text-base">
                      Continue with Google
                    </Text>
                  </>
                )}
              </GlowCard>
            </Pressable>

            {/* X (Twitter) */}
            <Pressable
              onPress={() => handleLogin("twitter")}
              disabled={!!activeProvider}
            >
              <GlowCard
                glowColor={Colors.pump + "30"}
                className="flex-row items-center justify-center gap-3 py-4 px-6"
              >
                {activeProvider === "twitter" ? (
                  <ActivityIndicator color={Colors.pump} />
                ) : (
                  <>
                    <Ionicons name="logo-twitter" size={20} color={Colors.white} />
                    <Text className="text-white font-bold font-mono text-base">
                      Continue with X
                    </Text>
                  </>
                )}
              </GlowCard>
            </Pressable>
          </View>
        </AnimatedEntry>

        {/* Footer */}
        <AnimatedEntry index={2}>
          <Text className="text-white/20 font-mono text-xs text-center mt-8">
            A Solana wallet will be created for you automatically
          </Text>
        </AnimatedEntry>
      </View>
    </SafeAreaView>
  );
}
