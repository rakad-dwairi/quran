import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, type PropsWithChildren } from "react";
import { I18nManager, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { AdsProvider } from "@/providers/AdsProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import i18n from "@/i18n";
import { isRTLAppLanguage } from "@/i18n/config";
import { resolvePrayerLocation } from "@/services/prayerLocation";
import { schedulePrayerNotifications } from "@/services/prayerNotifications";
import {
  cancelReadingPlanNotifications,
  scheduleReadingPlanNotifications,
} from "@/services/readingPlanNotifications";
import { useSettingsStore } from "@/store/settingsStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "reactQuery",
});

export function AppProviders({ children }: PropsWithChildren) {
  const appLanguage = useSettingsStore((state) => state.appLanguage);
  const isRTL = isRTLAppLanguage(appLanguage);

  useEffect(() => {
    i18n.changeLanguage(appLanguage).catch(() => {});
    I18nManager.allowRTL(isRTL);
  }, [appLanguage, isRTL]);

  return (
    <SafeAreaProvider>
      <AdsProvider>
        <ToastProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister,
              maxAge: 1000 * 60 * 60 * 24 * 3,
            }}
          >
            <PrayerNotificationsBootstrap />
            <ReadingPlanNotificationsBootstrap />
            <View style={{ flex: 1 }}>{children}</View>
          </PersistQueryClientProvider>
        </ToastProvider>
      </AdsProvider>
    </SafeAreaProvider>
  );
}

function PrayerNotificationsBootstrap() {
  const {
    prayerNotificationsEnabled,
    prayerAdhanEnabled,
    prayerAdhanSound,
    prayerCalculationMethod,
    prayerMadhab,
    prayerLocationMode,
    prayerManualCity,
    prayerManualCountry,
    prayerManualLatitude,
    prayerManualLongitude,
    prayerReminderMinutes,
    prayerPerPrayerNotifications,
    appLanguage,
  } = useSettingsStore(
    useShallow((state) => ({
      prayerNotificationsEnabled: state.prayerNotificationsEnabled,
      prayerAdhanEnabled: state.prayerAdhanEnabled,
      prayerAdhanSound: state.prayerAdhanSound,
      prayerCalculationMethod: state.prayerCalculationMethod,
      prayerMadhab: state.prayerMadhab,
      prayerLocationMode: state.prayerLocationMode,
      prayerManualCity: state.prayerManualCity,
      prayerManualCountry: state.prayerManualCountry,
      prayerManualLatitude: state.prayerManualLatitude,
      prayerManualLongitude: state.prayerManualLongitude,
      prayerReminderMinutes: state.prayerReminderMinutes,
      prayerPerPrayerNotifications: state.prayerPerPrayerNotifications,
      appLanguage: state.appLanguage,
    }))
  );

  useEffect(() => {
    if (!prayerNotificationsEnabled) return;

    let cancelled = false;

    (async () => {
      try {
        const location = await resolvePrayerLocation({
          mode: prayerLocationMode,
          manual: {
            city: prayerManualCity,
            country: prayerManualCountry,
            latitude: prayerManualLatitude,
            longitude: prayerManualLongitude,
          },
          requestPermission: false,
        });

        if (cancelled) return;

        await schedulePrayerNotifications({
          coords: location.coords,
          place: location.place,
          settings: {
            notificationsEnabled: prayerNotificationsEnabled,
            adhanEnabled: prayerAdhanEnabled,
            adhanSound: prayerAdhanSound,
            calculationMethod: prayerCalculationMethod,
            madhab: prayerMadhab,
            reminderMinutes: prayerReminderMinutes,
            perPrayerNotifications: prayerPerPrayerNotifications,
            appLanguage,
          },
        });
      } catch {
        // Do not prompt on app launch. The settings screen surfaces actionable errors.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    prayerNotificationsEnabled,
    prayerAdhanEnabled,
    prayerAdhanSound,
    prayerCalculationMethod,
    prayerMadhab,
    prayerLocationMode,
    prayerManualCity,
    prayerManualCountry,
    prayerManualLatitude,
    prayerManualLongitude,
    prayerReminderMinutes,
    prayerPerPrayerNotifications,
    appLanguage,
  ]);

  return null;
}

function ReadingPlanNotificationsBootstrap() {
  const {
    appLanguage,
    readingPlanEnabled,
    readingPlanReminderEnabled,
    readingPlanReminderHour,
    readingPlanReminderMinute,
  } = useSettingsStore(
    useShallow((state) => ({
      appLanguage: state.appLanguage,
      readingPlanEnabled: state.readingPlanEnabled,
      readingPlanReminderEnabled: state.readingPlanReminderEnabled,
      readingPlanReminderHour: state.readingPlanReminderHour,
      readingPlanReminderMinute: state.readingPlanReminderMinute,
    }))
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!readingPlanEnabled || !readingPlanReminderEnabled) {
        await cancelReadingPlanNotifications();
        return;
      }
      try {
        await scheduleReadingPlanNotifications({
          hour: readingPlanReminderHour,
          minute: readingPlanReminderMinute,
          appLanguage,
          daysAhead: 14,
        });
      } catch {
        if (cancelled) return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    appLanguage,
    readingPlanEnabled,
    readingPlanReminderEnabled,
    readingPlanReminderHour,
    readingPlanReminderMinute,
  ]);

  return null;
}
