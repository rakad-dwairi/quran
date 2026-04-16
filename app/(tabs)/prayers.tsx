import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { IconButton } from "@/components/IconButton";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
import { PRAYER_IDS, type PrayerId } from "@/constants/prayer";
import { buildManualPrayerLocation, getAutoPrayerLocation, type PrayerLocationResult } from "@/services/prayerLocation";
import { schedulePrayerNotifications } from "@/services/prayerNotifications";
import {
  buildPrayerTimes,
  formatPrayerCountdown,
  formatPrayerDate,
  formatPrayerTime,
  getActivePrayer,
  getNextPrayer,
  getPrayerCalculationMethodLabel,
  getPrayerLabel,
  getPrayerMadhabLabel,
} from "@/services/prayerTimes";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";

function formatDegrees(value: number) {
  const normalized = ((value % 360) + 360) % 360;
  return `${Math.round(normalized)} deg`;
}

function fallbackPlace(location: PrayerLocationResult | null) {
  if (!location) return null;
  if (location.place) return location.place;
  return `${location.coords.latitude.toFixed(3)}, ${location.coords.longitude.toFixed(3)}`;
}

export default function PrayersScreen() {
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
    setPrayerNotificationForPrayer,
  } = useSettingsStore();

  const [busy, setBusy] = useState(false);
  const [location, setLocation] = useState<PrayerLocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canWatchHeading, setCanWatchHeading] = useState(false);
  const [heading, setHeading] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const notificationSettings = useMemo(
    () => ({
      notificationsEnabled: prayerNotificationsEnabled,
      adhanEnabled: prayerAdhanEnabled,
      adhanSound: prayerAdhanSound,
      calculationMethod: prayerCalculationMethod,
      madhab: prayerMadhab,
      reminderMinutes: prayerReminderMinutes,
      perPrayerNotifications: prayerPerPrayerNotifications,
    }),
    [
      prayerNotificationsEnabled,
      prayerAdhanEnabled,
      prayerAdhanSound,
      prayerCalculationMethod,
      prayerMadhab,
      prayerReminderMinutes,
      prayerPerPrayerNotifications,
    ]
  );

  const reschedulePrayerAlerts = useCallback(
    async (nextLocation: PrayerLocationResult, perPrayer: Record<PrayerId, boolean> = prayerPerPrayerNotifications) => {
      if (!prayerNotificationsEnabled) return;
      await schedulePrayerNotifications({
        coords: nextLocation.coords,
        place: nextLocation.place,
        settings: {
          ...notificationSettings,
          perPrayerNotifications: perPrayer,
        },
      });
    },
    [notificationSettings, prayerNotificationsEnabled, prayerPerPrayerNotifications]
  );

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const nextLocation =
        prayerLocationMode === "manual"
          ? buildManualPrayerLocation({
              city: prayerManualCity,
              country: prayerManualCountry,
              latitude: prayerManualLatitude,
              longitude: prayerManualLongitude,
            })
          : await getAutoPrayerLocation({ requestPermission: true });

      if (!nextLocation) {
        throw new Error("Set a manual city/country in Prayer Alerts before using manual location.");
      }

      setLocation(nextLocation);
      await reschedulePrayerAlerts(nextLocation);

      const permission = await Location.getForegroundPermissionsAsync();
      setCanWatchHeading(permission.status === "granted");
    } catch (e) {
      setLocation(null);
      setCanWatchHeading(false);
      setError(e instanceof Error ? e.message : "Could not load prayer times.");
    } finally {
      setBusy(false);
    }
  }, [
    prayerLocationMode,
    prayerManualCity,
    prayerManualCountry,
    prayerManualLatitude,
    prayerManualLongitude,
    reschedulePrayerAlerts,
  ]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!canWatchHeading) {
      setHeading(null);
      return;
    }

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      try {
        subscription = await Location.watchHeadingAsync((h) => {
          if (cancelled) return;
          const nextHeading = h.trueHeading > 0 ? h.trueHeading : h.magHeading;
          if (!Number.isFinite(nextHeading)) return;
          setHeading(nextHeading);
        });
      } catch {
        setHeading(null);
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [canWatchHeading]);

  const computed = useMemo(() => {
    if (!location) return null;
    const built = buildPrayerTimes(location.coords, now, {
      calculationMethod: prayerCalculationMethod,
      madhab: prayerMadhab,
    });
    const next = getNextPrayer(built.times, {
      coordinates: built.coordinates,
      params: built.params,
      now,
    });
    const active = getActivePrayer(built.times, now);
    return { ...built, next, active };
  }, [location, now, prayerCalculationMethod, prayerMadhab]);

  const qiblaRotation = useMemo(() => {
    if (!computed) return null;
    if (heading === null) return computed.qiblaDegrees;
    return ((computed.qiblaDegrees - heading) % 360 + 360) % 360;
  }, [computed, heading]);

  const placeLabel = fallbackPlace(location);

  async function togglePrayerNotification(prayerId: PrayerId) {
    const nextEnabled = !prayerPerPrayerNotifications[prayerId];
    const nextPerPrayer = {
      ...prayerPerPrayerNotifications,
      [prayerId]: nextEnabled,
    };
    setPrayerNotificationForPrayer(prayerId, nextEnabled);

    if (location && prayerNotificationsEnabled) {
      try {
        await reschedulePrayerAlerts(location, nextPerPrayer);
      } catch {
        // Keep the preference change; settings screen can retry scheduling with a clear error.
      }
    }
  }

  return (
    <Screen className="pt-6">
      <AppHeader
        title="Prayers"
        subtitle={placeLabel ? `Today in ${placeLabel}` : "Prayer times near you."}
        right={
          <View className="flex-row items-center">
            <IconButton
              name="refresh"
              accessibilityLabel="Refresh prayer times"
              onPress={() => refresh()}
              color={colors.text}
            />
            <NowPlayingButton />
          </View>
        }
      />

      {busy && !computed ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator />
          <Text className="mt-3 font-ui text-muted">Getting prayer times...</Text>
        </View>
      ) : error ? (
        <View className="rounded-2xl border border-border bg-surface px-4 py-6">
          <Text className="font-uiSemibold text-base text-text">Could not load prayer times</Text>
          <Text className="mt-2 font-ui text-muted">{error}</Text>
          <View className="mt-5 flex-row gap-3">
            <Pressable
              className="flex-1 rounded-2xl bg-primary px-5 py-3 active:opacity-80"
              onPress={() => refresh()}
            >
              <Text className="text-center font-uiSemibold text-primaryForeground">
                {busy ? "Refreshing..." : "Retry"}
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-2xl border border-border bg-bg px-5 py-3 active:opacity-80"
              onPress={() => router.push("/settings/notifications")}
            >
              <Text className="text-center font-uiSemibold text-text">Prayer Alerts</Text>
            </Pressable>
          </View>
        </View>
      ) : computed ? (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="rounded-3xl border border-border bg-surface p-4">
            <Text className="font-ui text-sm text-muted">{formatPrayerDate(now)}</Text>
            <Text className="mt-1 font-uiSemibold text-lg text-text">{placeLabel ?? "Current location"}</Text>

            <View className="mt-4 rounded-2xl bg-primary px-4 py-4">
              <Text className="font-uiMedium text-sm text-primaryForeground">
                Next prayer: {getPrayerLabel(computed.next.id)} in{" "}
                {formatPrayerCountdown(computed.next.at.getTime() - now.getTime())}
              </Text>
              <Text className="mt-1 font-ui text-sm text-primaryForeground opacity-90">
                {formatPrayerTime(computed.next.at)}
              </Text>
            </View>

            <View className="mt-3 flex-row flex-wrap gap-2">
              <View className="rounded-full bg-bg px-3 py-1">
                <Text className="font-ui text-xs text-muted">
                  {getPrayerCalculationMethodLabel(prayerCalculationMethod)}
                </Text>
              </View>
              <View className="rounded-full bg-bg px-3 py-1">
                <Text className="font-ui text-xs text-muted">{getPrayerMadhabLabel(prayerMadhab)}</Text>
              </View>
              <View className="rounded-full bg-bg px-3 py-1">
                <Text className="font-ui text-xs text-muted">
                  Alerts {prayerNotificationsEnabled ? "on" : "off"}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-4 rounded-3xl border border-border bg-surface p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-uiSemibold text-base text-text">Today</Text>
                <Text className="mt-1 font-ui text-sm text-muted">
                  Bell toggles control each prayer alert.
                </Text>
              </View>
              <Pressable
                className="rounded-full bg-bg px-3 py-2 active:opacity-80"
                onPress={() => router.push("/settings/notifications")}
              >
                <Text className="font-uiMedium text-xs text-text">Settings</Text>
              </Pressable>
            </View>

            <View className="mt-4 gap-2">
              {PRAYER_IDS.map((prayerId) => {
                const isActive = computed.active === prayerId;
                const isNext = computed.next.id === prayerId;
                const notificationsOn = prayerNotificationsEnabled && prayerPerPrayerNotifications[prayerId];
                const savedOn = prayerPerPrayerNotifications[prayerId];

                return (
                  <View
                    key={prayerId}
                    className={`flex-row items-center rounded-2xl border px-4 py-3 ${
                      isActive
                        ? "border-primary bg-primaryMuted"
                        : isNext
                          ? "border-accent bg-bg"
                          : "border-border bg-bg"
                    }`}
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className={`font-uiSemibold text-base ${isActive ? "text-primary" : "text-text"}`}>
                          {getPrayerLabel(prayerId)}
                        </Text>
                        {isActive ? (
                          <Text className="ml-2 rounded-full bg-primary px-2 py-0.5 font-uiMedium text-xs text-primaryForeground">
                            Active
                          </Text>
                        ) : isNext ? (
                          <Text className="ml-2 rounded-full bg-accent px-2 py-0.5 font-uiMedium text-xs text-accentForeground">
                            Next
                          </Text>
                        ) : null}
                      </View>
                      <Text className="mt-1 font-ui text-sm text-muted">
                        {notificationsOn
                          ? "Notification enabled"
                          : savedOn
                            ? "Global alerts are off"
                            : "Notification disabled"}
                      </Text>
                    </View>

                    <Text className={`mr-4 font-uiSemibold text-base ${isActive ? "text-primary" : "text-text"}`}>
                      {formatPrayerTime(computed.times[prayerId])}
                    </Text>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${savedOn ? "Disable" : "Enable"} ${getPrayerLabel(prayerId)} alert`}
                      className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
                      onPress={() => togglePrayerNotification(prayerId)}
                    >
                      <MaterialCommunityIcons
                        name={savedOn ? "bell" : "bell-off-outline"}
                        size={22}
                        color={notificationsOn ? colors.primary : colors.muted}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>

          <View className="mt-4 rounded-3xl border border-border bg-surface p-4">
            <Text className="font-uiSemibold text-base text-text">Qibla</Text>
            <Text className="mt-1 font-ui text-sm text-muted">
              {heading === null
                ? `Direction to Makkah: ${formatDegrees(computed.qiblaDegrees)}`
                : "Rotate your phone until the arrow points up."}
            </Text>

            <View className="mt-5 items-center">
              <View className="h-56 w-56 items-center justify-center rounded-full border border-border bg-bg">
                <Text className="absolute top-4 font-uiSemibold text-xs text-muted">N</Text>
                <Text className="absolute bottom-4 font-ui text-xs text-muted">
                  {formatDegrees(computed.qiblaDegrees)}
                </Text>

                {qiblaRotation !== null ? (
                  <View style={{ transform: [{ rotate: `${qiblaRotation}deg` }] }}>
                    <MaterialCommunityIcons name="navigation" size={56} color={colors.primary} />
                  </View>
                ) : null}
              </View>

              {heading === null ? (
                <Text className="mt-3 text-center font-ui text-xs text-muted">
                  Compass heading may not be available on simulators.
                </Text>
              ) : (
                <Text className="mt-3 font-ui text-xs text-muted">Heading: {formatDegrees(heading)}</Text>
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View className="rounded-2xl border border-border bg-surface px-4 py-6">
          <Text className="font-uiSemibold text-base text-text">Prayer times</Text>
          <Text className="mt-2 font-ui text-muted">Tap refresh to load your location.</Text>
          <Pressable
            className="mt-5 self-start rounded-2xl bg-primary px-5 py-3 active:opacity-80"
            onPress={() => refresh()}
          >
            <Text className="font-uiSemibold text-primaryForeground">{busy ? "Refreshing..." : "Refresh"}</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}
