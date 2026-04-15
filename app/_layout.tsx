import "../global.css";

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
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

  useEffect(() => {
    if (initializing) return;
    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }
  }, [initializing, user, inAuthGroup, router]);

  // Prevent rendering the wrong route while we redirect.
  if (initializing) return null;
  if (!user && !inAuthGroup) return null;
  if (user && inAuthGroup) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
