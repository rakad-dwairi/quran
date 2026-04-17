import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { AppHeader } from "@/components/AppHeader";
import { IconButton } from "@/components/IconButton";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
import { PRAYER_IDS, type PrayerId } from "@/constants/prayer";
import { useAppLocale } from "@/i18n/useAppLocale";
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
  return `${Math.round(normalized)}°`;
}

function fallbackPlace(location: PrayerLocationResult | null) {
  if (!location) return null;
  if (location.place) return location.place;
  return `${location.coords.latitude.toFixed(3)}, ${location.coords.longitude.toFixed(3)}`;
}

function KaabaMarker({ rotation }: { rotation: number }) {
  return (
    <View
      pointerEvents="none"
      className="absolute h-48 w-48 items-center"
      style={{ transform: [{ rotate: `${rotation}deg` }] }}
    >
      <View className="mt-1 items-center">
        <View className="h-12 w-12 items-center rounded-xl border border-[#B18A3D] bg-text">
          <View className="mt-2 h-1.5 w-full bg-accent" />
          <View className="mt-4 h-4 w-2 rounded-sm bg-[#B18A3D]" />
        </View>
        <View className="h-20 w-1 rounded-full bg-primary" />
      </View>
    </View>
  );
}

export default function PrayersScreen() {
  const { t, textAlign, rowDirection, isRTL } = useAppLocale();
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
    setPrayerNotificationForPrayer,
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
      setPrayerNotificationForPrayer: state.setPrayerNotificationForPrayer,
    }))
  );

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
      appLanguage,
      adhanEnabled: prayerAdhanEnabled,
      adhanSound: prayerAdhanSound,
      calculationMethod: prayerCalculationMethod,
      madhab: prayerMadhab,
      reminderMinutes: prayerReminderMinutes,
      perPrayerNotifications: prayerPerPrayerNotifications,
    }),
    [
      prayerNotificationsEnabled,
      appLanguage,
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
        throw new Error(t("prayers.manualLocationError"));
      }

      setLocation(nextLocation);
      await reschedulePrayerAlerts(nextLocation);

      const permission = await Location.getForegroundPermissionsAsync();
      setCanWatchHeading(permission.status === "granted");
    } catch (e) {
      setLocation(null);
      setCanWatchHeading(false);
      setError(e instanceof Error ? e.message : t("prayers.loadErrorTitle"));
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
        title={t("tabs.prayers")}
        subtitle={
          placeLabel
            ? t("prayers.subtitleWithPlace", { place: placeLabel })
            : t("prayers.subtitleFallback")
        }
        right={
          <View className="items-center" style={{ flexDirection: rowDirection }}>
            <IconButton
              name="refresh"
              accessibilityLabel={t("prayers.refreshAria")}
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
          <Text className="mt-3 font-ui text-muted" style={{ textAlign }}>
            {t("prayers.loading")}
          </Text>
        </View>
      ) : error ? (
        <View className="rounded-2xl border border-border bg-surface px-4 py-6">
          <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>
            {t("prayers.loadErrorTitle")}
          </Text>
          <Text className="mt-2 font-ui text-muted" style={{ textAlign }}>{error}</Text>
          <View className="mt-5 gap-3" style={{ flexDirection: rowDirection }}>
            <Pressable
              className="flex-1 rounded-2xl bg-primary px-5 py-3 active:opacity-80"
              onPress={() => refresh()}
            >
              <Text className="text-center font-uiSemibold text-primaryForeground">
                {busy ? t("prayers.refreshing") : t("common.retry")}
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-2xl border border-border bg-bg px-5 py-3 active:opacity-80"
              onPress={() => router.push("/settings/notifications")}
            >
              <Text className="text-center font-uiSemibold text-text">{t("settings.dailyVerseAndPrayerAlerts")}</Text>
            </Pressable>
          </View>
        </View>
      ) : computed ? (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="rounded-3xl border border-border bg-surface p-4">
            <Text className="font-ui text-sm text-muted" style={{ textAlign }}>{formatPrayerDate(now)}</Text>
            <Text className="mt-1 font-uiSemibold text-lg text-text" style={{ textAlign }}>
              {placeLabel ?? t("prayers.currentLocation")}
            </Text>

            <View className="mt-4 rounded-2xl bg-primary px-4 py-4">
              <Text className="font-uiMedium text-sm text-primaryForeground" style={{ textAlign }}>
                {t("prayers.nextPrayerLine", { prayer: getPrayerLabel(computed.next.id) })}{" "}
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
                  {t("prayers.alertsStatus", {
                    status: prayerNotificationsEnabled ? t("common.on") : t("common.off"),
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-4 rounded-3xl border border-border bg-surface p-4">
            <View className="items-center justify-between" style={{ flexDirection: rowDirection }}>
              <View>
                <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("prayers.today")}</Text>
                <Text className="mt-1 font-ui text-sm text-muted" style={{ textAlign }}>
                  {t("prayers.bellHint")}
                </Text>
              </View>
              <Pressable
                className="rounded-full bg-bg px-3 py-2 active:opacity-80"
                onPress={() => router.push("/settings/notifications")}
              >
                <Text className="font-uiMedium text-xs text-text">{t("common.settings")}</Text>
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
                    className={`items-center rounded-2xl border px-4 py-3 ${
                      isActive
                        ? "border-primary bg-primaryMuted"
                        : isNext
                          ? "border-accent bg-bg"
                          : "border-border bg-bg"
                    }`}
                    style={{ flexDirection: rowDirection }}
                  >
                    <View className="flex-1">
                      <View className="items-center" style={{ flexDirection: rowDirection }}>
                        <Text className={`font-uiSemibold text-base ${isActive ? "text-primary" : "text-text"}`}>
                          {getPrayerLabel(prayerId)}
                        </Text>
                        {isActive ? (
                          <Text
                            className="rounded-full bg-primary px-2 py-0.5 font-uiMedium text-xs text-primaryForeground"
                            style={{ marginStart: 8 }}
                          >
                            {t("prayers.active")}
                          </Text>
                        ) : isNext ? (
                          <Text
                            className="rounded-full bg-accent px-2 py-0.5 font-uiMedium text-xs text-accentForeground"
                            style={{ marginStart: 8 }}
                          >
                            {t("prayers.next")}
                          </Text>
                        ) : null}
                      </View>
                      <Text className="mt-1 font-ui text-sm text-muted" style={{ textAlign }}>
                        {notificationsOn
                          ? t("prayers.notificationEnabled")
                          : savedOn
                            ? t("prayers.globalAlertsOff")
                            : t("prayers.notificationDisabled")}
                      </Text>
                    </View>

                    <Text
                      className={`font-uiSemibold text-base ${isActive ? "text-primary" : "text-text"}`}
                      style={{ marginEnd: 16 }}
                    >
                      {formatPrayerTime(computed.times[prayerId])}
                    </Text>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("prayers.toggleAlertAria", {
                        action: savedOn ? t("common.disable") : t("common.enable"),
                        prayer: getPrayerLabel(prayerId),
                      })}
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
            <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("prayers.qiblaTitle")}</Text>
            <Text className="mt-1 font-ui text-sm text-muted" style={{ textAlign }}>
              {heading === null
                ? t("prayers.qiblaNoHeading", { degrees: formatDegrees(computed.qiblaDegrees) })
                : t("prayers.qiblaWithHeading")}
            </Text>

            <View className="mt-5 items-center">
              <View className="h-56 w-56 items-center justify-center rounded-full border border-border bg-bg">
                <Text className="absolute top-4 font-uiSemibold text-xs text-muted">N</Text>
                <Text className="absolute left-4 font-ui text-[10px] text-muted">W</Text>
                <Text className="absolute right-4 font-ui text-[10px] text-muted">E</Text>
                <Text className="absolute bottom-10 font-ui text-[10px] text-muted">S</Text>
                <Text className="absolute bottom-4 font-ui text-xs text-muted">
                  {formatDegrees(computed.qiblaDegrees)}
                </Text>
                <View className="h-4 w-4 rounded-full border border-primary bg-primaryMuted" />

                {qiblaRotation !== null ? (
                  <KaabaMarker rotation={qiblaRotation} />
                ) : null}
              </View>

              {heading === null ? (
                <Text className="mt-3 text-center font-ui text-xs text-muted">
                  {t("prayers.qiblaSimulatorHint")}
                </Text>
              ) : (
                <Text className="mt-3 font-ui text-xs text-muted">
                  {t("prayers.headingLabel", { degrees: formatDegrees(heading) })}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View className="rounded-2xl border border-border bg-surface px-4 py-6">
          <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>
            {t("prayers.emptyTitle")}
          </Text>
          <Text className="mt-2 font-ui text-muted" style={{ textAlign }}>{t("prayers.emptyBody")}</Text>
          <Pressable
            className="mt-5 self-start rounded-2xl bg-primary px-5 py-3 active:opacity-80"
            onPress={() => refresh()}
          >
            <Text className="font-uiSemibold text-primaryForeground">
              {busy ? t("prayers.refreshing") : t("common.refresh")}
            </Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}
