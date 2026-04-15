import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla } from "adhan";
import { AppHeader } from "@/components/AppHeader";
import { IconButton } from "@/components/IconButton";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
import { colors } from "@/theme/colors";

type PrayerKey = "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

const PRAYER_ORDER: PrayerKey[] = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

function formatTime(value: Date) {
  return value.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDegrees(value: number) {
  const normalized = ((value % 360) + 360) % 360;
  return `${Math.round(normalized)}°`;
}

function buildPrayerTimes(coords: { latitude: number; longitude: number }, date: Date) {
  const coordinates = new Coordinates(coords.latitude, coords.longitude);
  const params = CalculationMethod.MuslimWorldLeague();
  params.madhab = Madhab.Shafi;
  const times = new PrayerTimes(coordinates, date, params);
  return {
    coordinates,
    params,
    qiblaDegrees: Qibla(coordinates),
    times: {
      Fajr: times.fajr,
      Sunrise: times.sunrise,
      Dhuhr: times.dhuhr,
      Asr: times.asr,
      Maghrib: times.maghrib,
      Isha: times.isha,
    } satisfies Record<PrayerKey, Date>,
  };
}

function getNextPrayer(
  today: Record<PrayerKey, Date>,
  { coordinates, params }: { coordinates: Coordinates; params: ReturnType<typeof CalculationMethod.MuslimWorldLeague> }
) {
  const now = new Date();
  for (const key of PRAYER_ORDER) {
    if (today[key].getTime() > now.getTime()) return { key, at: today[key] };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next = new PrayerTimes(coordinates, tomorrow, params);
  return { key: "Fajr" as const, at: next.fajr };
}

export default function PrayersScreen() {
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<Location.PermissionStatus | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [place, setPlace] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [heading, setHeading] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError("Location services are disabled. Enable them and try again.");
        return;
      }

      const perm = await Location.requestForegroundPermissionsAsync();
      setPermission(perm.status);
      if (perm.status !== "granted") {
        setCoords(null);
        setPlace(null);
        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync();
      const position =
        lastKnown ??
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }));

      const nextCoords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCoords(nextCoords);

      try {
        const places = await Location.reverseGeocodeAsync(nextCoords);
        const first = places[0];
        if (first) {
          const parts = [first.city, first.region, first.country].filter(Boolean);
          setPlace(parts.join(", "));
        } else {
          setPlace(null);
        }
      } catch {
        setPlace(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load location.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (permission !== "granted") {
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
  }, [permission]);

  const computed = useMemo(() => {
    if (!coords) return null;
    const { coordinates, params, times, qiblaDegrees } = buildPrayerTimes(coords, new Date());
    const next = getNextPrayer(times, { coordinates, params });
    return { times, next, qiblaDegrees };
  }, [coords]);

  const qiblaRotation = useMemo(() => {
    if (!computed) return null;
    if (heading === null) return computed.qiblaDegrees;
    return ((computed.qiblaDegrees - heading) % 360 + 360) % 360;
  }, [computed, heading]);

  return (
    <Screen className="pt-6">
      <AppHeader
        title="Prayers"
        subtitle={place ? `Today in ${place}` : "Prayer times near you."}
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
          <Text className="mt-3 font-ui text-muted">Getting location…</Text>
        </View>
      ) : error ? (
        <View className="rounded-2xl border border-border bg-surface px-4 py-6">
          <Text className="font-uiSemibold text-base text-text">Couldn't load prayer times</Text>
          <Text className="mt-2 font-ui text-muted">{error}</Text>
          <Pressable
            className="mt-5 self-start rounded-2xl bg-primary px-5 py-3 active:opacity-80"
            onPress={() => refresh()}
          >
            <Text className="font-uiSemibold text-white">{busy ? "Refreshing…" : "Retry"}</Text>
          </Pressable>
        </View>
      ) : permission && permission !== "granted" ? (
        <View className="rounded-2xl border border-border bg-surface px-4 py-6">
          <Text className="font-uiSemibold text-base text-text">Location permission needed</Text>
          <Text className="mt-2 font-ui text-muted">
            Enable location access to show accurate prayer times and Qibla near you.
          </Text>
          <Pressable
            className="mt-5 self-start rounded-2xl bg-primary px-5 py-3 active:opacity-80"
            onPress={() => refresh()}
          >
            <Text className="font-uiSemibold text-white">Enable location</Text>
          </Pressable>
        </View>
      ) : computed ? (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="rounded-2xl border border-border bg-surface p-4">
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
                  Compass heading isn’t available on many simulators. This will animate on a real device.
                </Text>
              ) : (
                <Text className="mt-3 font-ui text-xs text-muted">Heading: {formatDegrees(heading)}</Text>
              )}
            </View>
          </View>

          <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <View className="rounded-2xl bg-primaryMuted px-4 py-4">
              <Text className="font-uiSemibold text-base text-text">Next</Text>
              <Text className="mt-1 font-ui text-muted">
                {computed.next.key} • {formatTime(computed.next.at)}
              </Text>
            </View>

            <View className="mt-4">
              {PRAYER_ORDER.map((key) => {
                const highlight = key === computed.next.key;
                return (
                  <View key={key} className="flex-row items-center justify-between py-2">
                    <Text className={`font-uiMedium text-sm ${highlight ? "text-primary" : "text-text"}`}>
                      {key}
                    </Text>
                    <Text className={`font-uiSemibold text-sm ${highlight ? "text-primary" : "text-text"}`}>
                      {formatTime(computed.times[key])}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text className="mt-4 font-ui text-xs text-muted">
              Calculation: Muslim World League • Madhab: Shafi
            </Text>
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
            <Text className="font-uiSemibold text-white">{busy ? "Refreshing…" : "Refresh"}</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

