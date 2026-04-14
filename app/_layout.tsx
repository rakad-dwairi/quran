import "../global.css";

import { Stack } from "expo-router";
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
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
      </AppProviders>
    </GestureHandlerRootView>
  );
}
