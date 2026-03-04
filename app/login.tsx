import { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/theme";
import { GlowCard } from "@/components/GlowCard";
import { AnimatedEntry } from "@/components/AnimatedEntry";
import { useAuth, type AuthProvider } from "@/lib/auth";

type LoginProvider = AuthProvider;

export default function LoginScreen() {
  const { login, oauthLoading, authenticated } = useAuth();
  const [activeProvider, setActiveProvider] = useState<LoginProvider | null>(null);

  useEffect(() => {
    if (authenticated) {
      router.replace("/");
    }
  }, [authenticated]);

  if (authenticated) return null;

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
        {router.canGoBack() && (
          <Pressable
            onPress={() => router.back()}
            className="absolute top-4 left-4 z-10 p-2"
          >
            <Ionicons name="close" size={24} color={Colors.whiteDim} />
          </Pressable>
        )}

        {/* Logo */}
        <AnimatedEntry>
          <View className="items-center mb-10">
            <Image
              source={require("@/assets/pumpruglogo.png")}
              style={{ width: 200, height: 200 }}
              resizeMode="contain"
            />
            <Text style={{ color: Colors.whiteDim }} className="font-mono text-sm text-center mt-4">
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
                borderColor={Colors.dark300}
                className="flex-row items-center justify-center gap-3 py-4 px-6"
              >
                {activeProvider === "google" ? (
                  <ActivityIndicator color={Colors.pump} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color={Colors.white} />
                    <Text className="text-white font-bold text-base">
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
                borderColor={Colors.dark300}
                className="flex-row items-center justify-center gap-3 py-4 px-6"
              >
                {activeProvider === "twitter" ? (
                  <ActivityIndicator color={Colors.pump} />
                ) : (
                  <>
                    <Ionicons name="logo-twitter" size={20} color={Colors.white} />
                    <Text className="text-white font-bold text-base">
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
          <Text style={{ color: Colors.whiteDim, opacity: 0.5 }} className="font-mono text-xs text-center mt-8">
            Sign in to place bets and climb the leaderboard
          </Text>
        </AnimatedEntry>
      </View>
    </SafeAreaView>
  );
}
