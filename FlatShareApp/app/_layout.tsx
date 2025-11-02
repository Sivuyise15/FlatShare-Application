import { ResidentProvider } from "./resident-sign-up";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRootNavigationState, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const router = useRouter();
  const navState = useRootNavigationState();

  // Check auth token + role on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const role = await AsyncStorage.getItem("userRole");

        if (!token) {
          setUserRole(null);
        } else {
          setUserRole(role);
        }
      } catch (err) {
        console.error("Error reading auth token:", err);
        setUserRole(null);
      } finally {
        setLoadingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Redirect based on role once nav + auth ready
  useEffect(() => {
    if (!navState?.key || loadingAuth) return;

    if (!userRole) {
      router.replace("/auth");
    } else {
      if (userRole === "admin") router.replace("/(tabs-admin)/home");
      else router.replace("/(tabs)/home");
    }
  }, [userRole, navState, loadingAuth]);

  // Loading screen while checking auth
  if (loadingAuth || !navState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Render router layout after auth and nav are ready
  return (
    <ResidentProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
      </Stack>
    </ResidentProvider>
  );
}
