import "../global.css";
import "@/i18n";

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
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
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      return {
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: data?.type === "prayerTime" && data.playSound === true,
        shouldSetBadge: false,
      };
    },
  });
}

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
  const localizationSetupComplete = useSettingsStore((state) => state.localizationSetupComplete);
  const handledNotificationIds = useRef(new Set<string>());

  const inAuthGroup = segments[0] === "(auth)";
  const inLocalizationSetup = segments[0] === "localization-setup";
  const shouldGoToLogin = !user && !inAuthGroup;
  const shouldGoToApp = !!user && inAuthGroup;

  useEffect(() => {
    if (initializing) return;
    if (!localizationSetupComplete && !inLocalizationSetup) {
      router.replace("/localization-setup");
      return;
    }
    if (localizationSetupComplete && inLocalizationSetup) {
      router.replace(user ? "/" : "/welcome");
      return;
    }
    if (shouldGoToLogin) {
      router.replace("/welcome");
    } else if (shouldGoToApp) {
      router.replace("/");
    }
  }, [
    inLocalizationSetup,
    initializing,
    localizationSetupComplete,
    router,
    shouldGoToApp,
    shouldGoToLogin,
    user,
  ]);

  useEffect(() => {
    let cancelled = false;

    const handle = (response: Notifications.NotificationResponse | null | undefined) => {
      if (!response) return;
      if (!user) return;

      const id = response.notification.request.identifier;
      if (handledNotificationIds.current.has(id)) return;
      handledNotificationIds.current.add(id);

      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      if (!data) return;

      if (data.type === "prayerTime") {
        router.push("/prayers");
        return;
      }

      if (data.type !== "dailyVerse") return;

      const chapterId = typeof data.chapterId === "number" ? data.chapterId : Number(data.chapterId);
      const verseKey = typeof data.verseKey === "string" ? data.verseKey : "";
      if (!Number.isFinite(chapterId) || chapterId <= 0 || !verseKey) return;

      router.push({ pathname: `/surah/${chapterId}`, params: { verseKey } });
    };

    Notifications.getLastNotificationResponseAsync()
      .then((res) => {
        if (cancelled) return;
        handle(res);
      })
      .catch(() => {});

    const sub = Notifications.addNotificationResponseReceivedListener((res) => handle(res));
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [router, user]);

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />

      {/* Keep the navigator mounted while we redirect (prevents "no navigator" warnings). */}
      {initializing || !localizationSetupComplete || shouldGoToLogin || shouldGoToApp ? (
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
