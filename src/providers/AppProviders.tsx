import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, type PropsWithChildren } from "react";
import { AdsProvider } from "@/providers/AdsProvider";
import { resolvePrayerLocation } from "@/services/prayerLocation";
import { schedulePrayerNotifications } from "@/services/prayerNotifications";
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
  return (
    <SafeAreaProvider>
      <AdsProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 1000 * 60 * 60 * 24 * 3,
          }}
        >
          <PrayerNotificationsBootstrap />
          {children}
        </PersistQueryClientProvider>
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
  } = useSettingsStore();

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
  ]);

  return null;
}
