import { View } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/lib/auth";

export default function TabLayout() {
  const { authenticated, isReady } = useAuth();

  // Redirect to login if not authenticated
  if (isReady && !authenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.dark100,
          borderTopWidth: 0,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={{ flex: 1 }}>
            <LinearGradient
              colors={[Colors.pump + "15", "transparent"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ height: 1 }}
            />
            <View style={{ flex: 1, backgroundColor: Colors.dark100 }} />
          </View>
        ),
        tabBarActiveTintColor: Colors.pump,
        tabBarInactiveTintColor: Colors.whiteDim,
        tabBarLabelStyle: {
          fontFamily: "SpaceMono",
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Rounds",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={
                focused
                  ? {
                      shadowColor: Colors.pump,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 8,
                    }
                  : undefined
              }
            >
              <Ionicons name="flame" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Ranks",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={
                focused
                  ? {
                      shadowColor: Colors.pump,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 8,
                    }
                  : undefined
              }
            >
              <Ionicons name="trophy" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={
                focused
                  ? {
                      shadowColor: Colors.pump,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 8,
                    }
                  : undefined
              }
            >
              <Ionicons name="person" size={size} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
