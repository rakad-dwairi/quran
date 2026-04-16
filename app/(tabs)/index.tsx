import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Share, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { AppHeader } from "@/components/AppHeader";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
import {
  useChaptersQuery,
  useRecitationsQuery,
  useVerseByKeyQuery,
} from "@/hooks/quranQueries";
import { useAuth } from "@/providers/AuthProvider";
import { buildManualPrayerLocation, resolvePrayerLocation } from "@/services/prayerLocation";
import {
  buildPrayerTimes,
  formatPrayerCountdown,
  formatPrayerTime,
  getActivePrayer,
  getNextPrayer,
  getPrayerLabel,
} from "@/services/prayerTimes";
import { pickVerseKeyForDate } from "@/services/dailyVerse";
import { useLibraryStore } from "@/store/libraryStore";
import { useAudioStore } from "@/store/audioStore";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";

function greetingName(input: string | null | undefined) {
  const trimmed = input?.trim();
  if (!trimmed) return "friend";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function formatClock(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatStreakLabel(days: number) {
  if (days <= 0) return "No streak yet";
  if (days === 1) return "1 day streak";
  return `${days} day streak`;
}

function ProfileButton() {
  const user = useAuth().user;
  const initial = (user?.email?.trim()?.[0] ?? "U").toUpperCase();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      onPress={() => router.push("/settings")}
      className="ml-2 h-10 w-10 overflow-hidden rounded-full border border-border bg-surface active:opacity-80"
    >
      {user?.photoURL ? (
        <Image source={{ uri: user.photoURL }} className="h-10 w-10" resizeMode="cover" />
      ) : (
        <View className="h-10 w-10 items-center justify-center bg-primaryMuted">
          <Text className="font-uiSemibold text-sm text-text">{initial}</Text>
        </View>
      )}
    </Pressable>
  );
}

type FeatureItem = {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
};

export default function HomeScreen() {
  const user = useAuth().user;
  const [now, setNow] = useState(() => new Date());
  const [prayerPlace, setPrayerPlace] = useState<string | null>(null);
  const [prayerCoords, setPrayerCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const {
    translationId,
    recitationId,
    prayerCalculationMethod,
    prayerMadhab,
    prayerLocationMode,
    prayerManualCity,
    prayerManualCountry,
    prayerManualLatitude,
    prayerManualLongitude,
    lastReadChapterId,
    lastReadVerseKey,
    readingStreak,
  } = useSettingsStore(
    useShallow((state) => ({
      translationId: state.translationId,
      recitationId: state.recitationId,
      prayerCalculationMethod: state.prayerCalculationMethod,
      prayerMadhab: state.prayerMadhab,
      prayerLocationMode: state.prayerLocationMode,
      prayerManualCity: state.prayerManualCity,
      prayerManualCountry: state.prayerManualCountry,
      prayerManualLatitude: state.prayerManualLatitude,
      prayerManualLongitude: state.prayerManualLongitude,
      lastReadChapterId: state.lastReadChapterId,
      lastReadVerseKey: state.lastReadVerseKey,
      readingStreak: state.readingStreak,
    }))
  );

  const bookmarkMap = useLibraryStore((state) => state.bookmarks);
  const favoriteMap = useLibraryStore((state) => state.favorites);
  const bookmarks = useMemo(() => Object.values(bookmarkMap), [bookmarkMap]);
  const favorites = useMemo(() => Object.values(favoriteMap), [favoriteMap]);
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);

  const {
    chapterId: audioChapterId,
    title: audioTitle,
    mode: audioMode,
    isPlaying,
  } = useAudioStore(
    useShallow((state) => ({
      chapterId: state.chapterId,
      title: state.title,
      mode: state.mode,
      isPlaying: state.isPlaying,
    }))
  );

  const chaptersQuery = useChaptersQuery({ language: "en" });
  const recitationsQuery = useRecitationsQuery({ language: "en" });

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const manualLocation = buildManualPrayerLocation({
          city: prayerManualCity,
          country: prayerManualCountry,
          latitude: prayerManualLatitude,
          longitude: prayerManualLongitude,
        });

        const location = await resolvePrayerLocation({
          mode: prayerLocationMode,
          manual: {
            city: prayerManualCity,
            country: prayerManualCountry,
            latitude: prayerManualLatitude,
            longitude: prayerManualLongitude,
          },
          requestPermission: false,
        }).catch(() => manualLocation);

        if (cancelled || !location) return;
        setPrayerCoords(location.coords);
        setPrayerPlace(location.place);
      } catch {
        if (cancelled) return;
        setPrayerCoords(null);
        setPrayerPlace(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    prayerLocationMode,
    prayerManualCity,
    prayerManualCountry,
    prayerManualLatitude,
    prayerManualLongitude,
  ]);

  const todayVerseKey = useMemo(() => {
    if (!chaptersQuery.data?.length) return "";
    return pickVerseKeyForDate(now, chaptersQuery.data).verseKey;
  }, [chaptersQuery.data, now]);

  const todayVerseQuery = useVerseByKeyQuery({
    verseKey: todayVerseKey,
    translationId,
    recitationId,
    language: "en",
  });

  const chaptersById = useMemo(() => {
    const map = new Map<number, string>();
    for (const chapter of chaptersQuery.data ?? []) {
      map.set(chapter.id, chapter.name_simple);
    }
    return map;
  }, [chaptersQuery.data]);

  const currentReciterName = useMemo(() => {
    const match = recitationsQuery.data?.find((item) => item.id === recitationId);
    return match?.reciter_name ?? "Current reciter";
  }, [recitationId, recitationsQuery.data]);

  const prayerSummary = useMemo(() => {
    if (!prayerCoords) return null;
    const built = buildPrayerTimes(prayerCoords, now, {
      calculationMethod: prayerCalculationMethod,
      madhab: prayerMadhab,
    });
    const active = getActivePrayer(built.times, now);
    const next = getNextPrayer(built.times, {
      coordinates: built.coordinates,
      params: built.params,
      now,
    });
    return { built, active, next };
  }, [now, prayerCoords, prayerCalculationMethod, prayerMadhab]);

  const currentPrayerLabel = prayerSummary?.active ? getPrayerLabel(prayerSummary.active) : "Before Fajr";
  const currentPrayerTime = prayerSummary?.active ? formatPrayerTime(prayerSummary.built.times[prayerSummary.active]) : null;

  const continueReadingLabel = useMemo(() => {
    if (!lastReadChapterId || !lastReadVerseKey) return null;
    const chapterName = chaptersById.get(lastReadChapterId) ?? `Surah ${lastReadChapterId}`;
    const verseNumber = Number(lastReadVerseKey.split(":")[1] ?? "1");
    return {
      chapterName,
      verseNumber,
    };
  }, [chaptersById, lastReadChapterId, lastReadVerseKey]);

  const savedTodayVerse = useLibraryStore((state) => (todayVerseKey ? !!state.favorites[todayVerseKey] : false));

  const features = useMemo<FeatureItem[]>(
    () => [
      { key: "quran", label: "Quran", icon: "book-open-page-variant", onPress: () => router.push("/quran") },
      { key: "duas", label: "Duas", icon: "hands-pray", onPress: () => router.push("/duas") },
      { key: "tasbih", label: "Tasbih", icon: "counter", onPress: () => router.push("/tasbih") },
      { key: "qibla", label: "Qibla", icon: "compass-outline", onPress: () => router.push("/prayers") },
      { key: "bookmarks", label: "Bookmarks", icon: "bookmark-outline", onPress: () => router.push("/bookmarks") },
    ],
    []
  );

  const greeting = greetingName(user?.displayName || user?.email?.split("@")[0]);
  const todayVerse = todayVerseQuery.data;

  return (
    <Screen className="pt-6">
      <AppHeader
        title={`Salaam ${greeting}`}
        subtitle={formatClock(now)}
        right={
          <View className="flex-row items-center">
            <NowPlayingButton />
            <ProfileButton />
          </View>
        }
      />

      <ScrollView className="mt-4 flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="rounded-2xl border border-border bg-surface p-4">
          <Text className="font-ui text-sm text-muted">{prayerPlace ?? "Prayer awareness"}</Text>
          <View className="mt-2 flex-row items-end justify-between">
            <View className="flex-1 pr-4">
              <Text className="font-uiSemibold text-lg text-text">{currentPrayerLabel}</Text>
              <Text className="mt-1 font-ui text-sm text-muted">
                {currentPrayerTime ? `Now: ${currentPrayerLabel} - ${currentPrayerTime}` : "Set prayer location to load times"}
              </Text>
            </View>
            <MaterialCommunityIcons name="clock-outline" size={28} color={colors.primary} />
          </View>

          {prayerSummary ? (
            <View className="mt-4 rounded-lg bg-bg px-4 py-3">
              <Text className="font-uiMedium text-sm text-text">
                Next: {getPrayerLabel(prayerSummary.next.id)} in{" "}
                {formatPrayerCountdown(prayerSummary.next.at.getTime() - now.getTime())}
              </Text>
              <Text className="mt-1 font-ui text-sm text-muted">{formatPrayerTime(prayerSummary.next.at)}</Text>
            </View>
          ) : (
            <Pressable
              className="mt-4 rounded-lg bg-primary px-4 py-3 active:opacity-80"
              onPress={() => router.push("/settings/notifications")}
            >
              <Text className="font-uiSemibold text-sm text-primaryForeground">Open Prayer Alerts</Text>
            </Pressable>
          )}
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <Text className="font-uiSemibold text-base text-text">Continue reading</Text>
          {continueReadingLabel && lastReadChapterId && lastReadVerseKey ? (
            <>
              <Text className="mt-2 font-ui text-sm text-muted">
                {continueReadingLabel.chapterName} · Ayah {continueReadingLabel.verseNumber}
              </Text>
              <Pressable
                className="mt-4 rounded-lg bg-primary px-4 py-3 active:opacity-80"
                onPress={() =>
                  router.push({
                    pathname: `/surah/${lastReadChapterId}`,
                    params: { verseKey: lastReadVerseKey },
                  })
                }
              >
                <Text className="font-uiSemibold text-sm text-primaryForeground">Continue Reading</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text className="mt-2 font-ui text-sm text-muted">Open any Surah and your place will appear here.</Text>
              <Pressable
                className="mt-4 rounded-lg bg-primary px-4 py-3 active:opacity-80"
                onPress={() => router.push("/quran")}
              >
                <Text className="font-uiSemibold text-sm text-primaryForeground">Start Reading</Text>
              </Pressable>
            </>
          )}
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-uiSemibold text-base text-text">Today's verse</Text>
            <Text className="font-ui text-xs text-muted">{todayVerseKey || "Loading"}</Text>
          </View>

          {todayVerse ? (
            <>
              <Text
                className="mt-4 font-arabic text-xl text-text"
                style={{ writingDirection: "rtl", textAlign: "right" }}
              >
                {todayVerse.text_uthmani}
              </Text>
              <Text className="mt-3 font-serif text-sm text-muted">
                {todayVerse.translations?.[0]?.textPlain ?? "Translation unavailable."}
              </Text>

              <View className="mt-4 flex-row gap-3">
                <Pressable
                  className={`flex-1 rounded-lg px-4 py-3 active:opacity-80 ${
                    savedTodayVerse ? "bg-primaryMuted" : "bg-bg"
                  }`}
                  onPress={() => {
                    toggleFavorite({
                      verseKey: todayVerse.verse_key,
                      chapterId: Number(todayVerse.verse_key.split(":")[0] ?? "0"),
                      verseNumber: todayVerse.verse_number,
                      arabicText: todayVerse.text_uthmani ?? "",
                      translationText: todayVerse.translations?.[0]?.textPlain,
                      createdAt: Date.now(),
                    });
                  }}
                >
                  <Text className="text-center font-uiSemibold text-sm text-text">
                    {savedTodayVerse ? "Saved" : "Save verse"}
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-1 rounded-lg bg-bg px-4 py-3 active:opacity-80"
                  onPress={async () => {
                    await Share.share({
                      message: `${todayVerse.verse_key}\n${todayVerse.text_uthmani ?? ""}\n\n${
                        todayVerse.translations?.[0]?.textPlain ?? ""
                      }`,
                    });
                  }}
                >
                  <Text className="text-center font-uiSemibold text-sm text-text">Share verse</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text className="mt-3 font-ui text-sm text-muted">
              {todayVerseQuery.isLoading ? "Loading today's verse..." : "Could not load today's verse."}
            </Text>
          )}
        </View>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-border bg-surface p-4">
            <Text className="font-ui text-sm text-muted">Habit</Text>
            <Text className="mt-2 font-uiSemibold text-lg text-text">{formatStreakLabel(readingStreak)}</Text>
          </View>
          <Pressable
            className="flex-1 rounded-2xl border border-border bg-surface p-4 active:opacity-80"
            onPress={() => router.push("/bookmarks")}
          >
            <Text className="font-ui text-sm text-muted">Saved content</Text>
            <Text className="mt-2 font-uiSemibold text-lg text-text">{favorites.length} saved verses</Text>
            <Text className="mt-1 font-ui text-sm text-muted">{bookmarks.length} bookmarks</Text>
          </Pressable>
        </View>

        <View className="mt-4">
          <Text className="font-uiSemibold text-base text-text">Features</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
            {features.map((feature, index) => (
              <Pressable
                key={feature.key}
                className={`mr-3 w-28 rounded-2xl border border-border bg-surface px-4 py-4 active:opacity-80 ${
                  index === features.length - 1 ? "mr-0" : ""
                }`}
                onPress={feature.onPress}
              >
                <MaterialCommunityIcons name={feature.icon} size={24} color={colors.primary} />
                <Text className="mt-3 font-uiMedium text-sm text-text">{feature.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <Text className="font-uiSemibold text-base text-text">Recitation</Text>
          {audioChapterId ? (
            <>
              <Text className="mt-2 font-ui text-sm text-muted">
                {audioTitle ?? `Surah ${audioChapterId}`} · {audioMode === "verse" ? "Verse by verse" : "Full Surah"}
              </Text>
              <Text className="mt-1 font-ui text-sm text-muted">
                {currentReciterName} · {isPlaying ? "Playing" : "Paused"}
              </Text>
              <Pressable
                className="mt-4 rounded-lg bg-primary px-4 py-3 active:opacity-80"
                onPress={() => router.push("/player")}
              >
                <Text className="font-uiSemibold text-sm text-primaryForeground">Resume</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text className="mt-2 font-ui text-sm text-muted">Start a recitation from any Surah to resume it here.</Text>
              <Pressable
                className="mt-4 rounded-lg bg-primary px-4 py-3 active:opacity-80"
                onPress={() => router.push("/quran")}
              >
                <Text className="font-uiSemibold text-sm text-primaryForeground">Browse Quran</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
