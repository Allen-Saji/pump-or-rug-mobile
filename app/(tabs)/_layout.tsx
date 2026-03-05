import { View } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { Colors } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/lib/auth";

export default function TabLayout() {
  const { authenticated, isReady } = useAuth();

  // Show nothing while Privy initializes to prevent flash
  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: Colors.dark }} />;
  }

  if (!authenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.dark100,
          borderTopWidth: 1,
          borderTopColor: Colors.dark300,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarActiveTintColor: Colors.pump,
        tabBarInactiveTintColor: Colors.whiteDim,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Rounds",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flame" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Ranks",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
