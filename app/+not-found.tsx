import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center bg-dark">
        <Text className="text-white text-2xl font-bold mb-4">
          404 — Rugged
        </Text>
        <Text className="text-white/60 mb-8">
          This page doesn't exist (yet).
        </Text>
        <Link href="/" className="text-pump text-lg underline">
          Back to Rounds
        </Link>
      </View>
    </>
  );
}
