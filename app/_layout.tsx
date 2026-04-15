import "../global.css";

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { Literata_400Regular, Literata_500Medium } from "@expo-google-fonts/literata";
import {
  NotoNaskhArabic_400Regular,
  NotoNaskhArabic_600SemiBold,
} from "@expo-google-fonts/noto-naskh-arabic";
import { AppProviders } from "@/providers/AppProviders";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { colors } from "@/theme/colors";

SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore (e.g. already hidden)
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Literata_400Regular,
    Literata_500Medium,
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </AppProviders>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { user, initializing } = useAuth();

  const inAuthGroup = segments[0] === "(auth)";
  const shouldGoToLogin = !user && !inAuthGroup;
  const shouldGoToApp = !!user && inAuthGroup;

  useEffect(() => {
    if (initializing) return;
    if (shouldGoToLogin) {
      router.replace("/welcome");
    } else if (shouldGoToApp) {
      router.replace("/");
    }
  }, [initializing, shouldGoToLogin, shouldGoToApp, router]);

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />

      {/* Keep the navigator mounted while we redirect (prevents "no navigator" warnings). */}
      {initializing || shouldGoToLogin || shouldGoToApp ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.bg,
          }}
        />
      ) : null}
    </View>
  );
}
