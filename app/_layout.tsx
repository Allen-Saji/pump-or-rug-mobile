import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useStore } from "@/lib/store";

export default function RootLayout() {
  const loadUser = useStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0A0A0A" },
          animation: "slide_from_right",
        }}
      />
    </>
  );
}
