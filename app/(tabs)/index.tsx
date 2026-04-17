import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Share, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { ActionButton } from "@/components/ActionButton";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { ReadingWeekStrip } from "@/components/ReadingWeekStrip";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  useChaptersQuery,
  useRecitationsQuery,
  useVerseByKeyQuery,
} from "@/hooks/quranQueries";
import { useAppLocale } from "@/i18n/useAppLocale";
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
import { addDays, getReadingPlanPace, getReadingPlanWeeklyReview, READING_MILESTONES, toDayKey } from "@/utils/readingPlan";

function greetingName(input: string | null | undefined, fallback: string) {
  const trimmed = input?.trim();
  if (!trimmed) return fallback;
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function formatClock(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatStreakLabel(days: number, t: (key: string, options?: Record<string, unknown>) => string) {
  if (days <= 0) return t("home.streakBegin");
  if (days === 1) return t("home.streakSingle");
  return t("home.streakPlural", { count: days });
}

function ProfileButton() {
  const user = useAuth().user;
  const { t } = useAppLocale();
  const initial = (user?.email?.trim()?.[0] ?? "U").toUpperCase();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("common.settings")}
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
  const { appLanguage, t, textAlign, rowDirection } = useAppLocale();
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
    readingPlanEnabled,
    readingPlanDurationDays,
    readingPlanStartDate,
    readingPlanCompletedDays,
    startReadingPlan,
    markReadingDayComplete,
    setReadingPlanDuration,
    readingStreakDate,
    readingActivityDays,
    milestonesUnlockedAt,
    readingPlanHistory,
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
      readingPlanEnabled: state.readingPlanEnabled,
      readingPlanDurationDays: state.readingPlanDurationDays,
      readingPlanStartDate: state.readingPlanStartDate,
      readingPlanCompletedDays: state.readingPlanCompletedDays,
      startReadingPlan: state.startReadingPlan,
      markReadingDayComplete: state.markReadingDayComplete,
      setReadingPlanDuration: state.setReadingPlanDuration,
      readingStreakDate: state.readingStreakDate,
      readingActivityDays: state.readingActivityDays,
      milestonesUnlockedAt: state.milestonesUnlockedAt,
      readingPlanHistory: state.readingPlanHistory,
    }))
  );

  const bookmarkMap = useLibraryStore((state) => state.bookmarks);
  const favoriteMap = useLibraryStore((state) => state.favorites);
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);
  const bookmarks = useMemo(() => Object.values(bookmarkMap), [bookmarkMap]);
  const favorites = useMemo(() => Object.values(favoriteMap), [favoriteMap]);

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

  const chaptersQuery = useChaptersQuery({ language: appLanguage });
  const recitationsQuery = useRecitationsQuery({ language: appLanguage });

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
    language: appLanguage,
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
    return match?.reciter_name ?? t("home.currentReciter");
  }, [recitationId, recitationsQuery.data, t]);

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

  const currentPrayerLabel = prayerSummary?.active ? getPrayerLabel(prayerSummary.active) : t("home.beforeFajr");
  const currentPrayerTime = prayerSummary?.active
    ? formatPrayerTime(prayerSummary.built.times[prayerSummary.active])
    : null;

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
      { key: "quran", label: t("tabs.quran"), icon: "book-open-page-variant", onPress: () => router.push("/quran") },
      { key: "prayers", label: t("tabs.prayers"), icon: "clock-outline", onPress: () => router.push("/prayers") },
      { key: "duas", label: t("home.duas"), icon: "hands-pray", onPress: () => router.push("/duas") },
      { key: "tasbih", label: t("home.tasbih"), icon: "counter", onPress: () => router.push("/tasbih") },
      { key: "qibla", label: t("home.qibla"), icon: "compass-outline", onPress: () => router.push("/prayers") },
      { key: "bookmarks", label: t("home.bookmarks"), icon: "bookmark-outline", onPress: () => router.push("/bookmarks") },
      { key: "downloads", label: t("settings.downloads"), icon: "download-outline", onPress: () => router.push("/settings/downloads") },
      { key: "plan", label: t("readingPlan.title"), icon: "calendar-check-outline", onPress: () => router.push("/settings/reading-plan") },
    ],
    [t]
  );

  const greeting = greetingName(user?.displayName || user?.email?.split("@")[0], t("home.friend"));
  const todayVerse = todayVerseQuery.data;
  const planPercent = Math.min(
    100,
    Math.round((readingPlanCompletedDays / Math.max(1, readingPlanDurationDays)) * 100)
  );
  const planRemainingDays = Math.max(0, readingPlanDurationDays - readingPlanCompletedDays);
  const expectedDateLabel = readingPlanStartDate
    ? addDays(readingPlanStartDate, readingPlanDurationDays - 1)
    : null;
  const readingPlanPace = getReadingPlanPace({
    enabled: readingPlanEnabled,
    startDate: readingPlanStartDate,
    completedDays: readingPlanCompletedDays,
    durationDays: readingPlanDurationDays,
    now,
  });
  const paceLabel =
    readingPlanPace?.status === "ahead"
      ? t("readingPlan.paceAhead", { count: readingPlanPace.deltaDays })
      : readingPlanPace?.status === "behind"
      ? t("readingPlan.paceBehind", { count: readingPlanPace.catchUpDays })
      : readingPlanPace?.status === "onTrack"
      ? t("readingPlan.paceOnTrack")
      : null;
  const todayTargetLabel = readingPlanPace
    ? t("readingPlan.byToday", {
        expected: readingPlanPace.expectedCompletedDays,
        duration: readingPlanDurationDays,
      })
    : null;
  const completedToday = readingStreakDate === toDayKey(now);
  const weeklyReview = getReadingPlanWeeklyReview({
    enabled: readingPlanEnabled,
    activityDays: readingActivityDays,
    now,
    weeklyTargetDays: 7,
  });
  const unlockedMilestones = READING_MILESTONES.filter((m) => Boolean(milestonesUnlockedAt[m.id]));
  const recentPlanHistory = readingPlanHistory.slice(0, 3);
  const milestoneLabelById: Record<(typeof READING_MILESTONES)[number]["id"], string> = {
    streak3: t("readingPlan.milestones.streak3"),
    streak7: t("readingPlan.milestones.streak7"),
    streak30: t("readingPlan.milestones.streak30"),
    planFirstComplete: t("readingPlan.milestones.planFirstComplete"),
    perfectWeek: t("readingPlan.milestones.perfectWeek"),
  };

  return (
    <Screen className="pt-6">
      <AppHeader
        title={t("home.greeting", { name: greeting })}
        subtitle={formatClock(now)}
        right={
          <View className="items-center" style={{ flexDirection: rowDirection }}>
            <NowPlayingButton />
            <ProfileButton />
          </View>
        }
      />

      <ScrollView className="mt-2 flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="gap-4">
          <SectionCard>
            <Text className="font-ui text-sm text-muted" style={{ textAlign }}>
              {prayerPlace ?? t("home.prayerSnapshot")}
            </Text>
            <View className="mt-3 items-start justify-between" style={{ flexDirection: rowDirection }}>
              <View className="flex-1 pr-4">
                <Text className="font-uiSemibold text-lg text-text">{currentPrayerLabel}</Text>
                <Text className="mt-1 font-ui text-sm leading-6 text-muted" style={{ textAlign }}>
                  {currentPrayerTime
                    ? t("home.nowPrayer", { prayer: currentPrayerLabel, time: currentPrayerTime })
                    : t("home.setPrayerLocation")}
                </Text>
              </View>
              <StatusBadge label={prayerSummary ? t("home.live") : t("home.needsSetup")} tone={prayerSummary ? "success" : "default"} />
            </View>

            {prayerSummary ? (
              <View className="mt-4 rounded-2xl bg-secondary px-4 py-4">
                <Text className="font-uiMedium text-sm text-text" style={{ textAlign }}>
                  {t("home.nextPrayer", {
                    prayer: getPrayerLabel(prayerSummary.next.id),
                    countdown: formatPrayerCountdown(prayerSummary.next.at.getTime() - now.getTime()),
                  })}
                </Text>
                <Text className="mt-1 font-ui text-sm text-muted">{formatPrayerTime(prayerSummary.next.at)}</Text>
              </View>
            ) : (
              <View className="mt-4">
                <ActionButton label={t("home.openPrayerAlerts")} onPress={() => router.push("/settings/notifications")} />
              </View>
            )}
          </SectionCard>

          <SectionCard>
            <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("home.continueReading")}</Text>
            {continueReadingLabel && lastReadChapterId && lastReadVerseKey ? (
              <>
                <Text className="mt-2 font-ui text-sm leading-6 text-muted" style={{ textAlign }}>
                  {t("home.readingReference", {
                    chapterName: continueReadingLabel.chapterName,
                    verse: continueReadingLabel.verseNumber,
                  })}
                </Text>
                <View className="mt-4">
                  <ActionButton
                    label={t("home.continueReadingAction")}
                    onPress={() =>
                      router.push({
                        pathname: `/surah/${lastReadChapterId}`,
                        params: { verseKey: lastReadVerseKey },
                      })
                    }
                  />
                </View>
              </>
            ) : (
              <>
                <Text className="mt-2 font-ui text-sm leading-6 text-muted" style={{ textAlign }}>
                  {t("home.continueReadingEmpty")}
                </Text>
                <View className="mt-4">
                  <ActionButton label={t("home.startReading")} onPress={() => router.push("/quran")} />
                </View>
              </>
            )}
          </SectionCard>

          <SectionCard>
            <View className="items-center justify-between" style={{ flexDirection: rowDirection }}>
              <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("home.todaysVerse")}</Text>
              <Text className="font-ui text-xs text-muted">{todayVerseKey || t("common.loading")}</Text>
            </View>

            {todayVerse ? (
              <>
                <Text
                  className="mt-4 font-arabic text-xl text-text"
                  style={{ writingDirection: "rtl", textAlign: "right" }}
                >
                  {todayVerse.text_uthmani}
                </Text>
                <Text className="mt-3 font-serif text-sm leading-6 text-muted" style={{ textAlign }}>
                  {todayVerse.translations?.[0]?.textPlain ?? t("home.translationUnavailable")}
                </Text>

                <View className="mt-4 gap-3" style={{ flexDirection: rowDirection }}>
                  <ActionButton
                    label={savedTodayVerse ? t("home.saved") : t("home.saveVerse")}
                    variant={savedTodayVerse ? "secondary" : "primary"}
                    className="flex-1"
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
                  />
                  <ActionButton
                    label={t("home.shareVerse")}
                    variant="secondary"
                    className="flex-1"
                    onPress={async () => {
                      await Share.share({
                        message: `${todayVerse.verse_key}\n${todayVerse.text_uthmani ?? ""}\n\n${todayVerse.translations?.[0]?.textPlain ?? ""}`,
                      });
                    }}
                  />
                </View>
              </>
            ) : todayVerseQuery.isLoading ? (
              <Text className="mt-3 font-ui text-sm text-muted" style={{ textAlign }}>{t("home.loadingTodaysVerse")}</Text>
            ) : (
              <EmptyState
                icon="book-outline"
                title={t("home.todaysVerseUnavailableTitle")}
                body={t("home.todaysVerseUnavailableBody")}
                actionLabel={t("home.browseQuran")}
                onAction={() => router.push("/quran")}
              />
            )}
          </SectionCard>

          <View className="gap-3" style={{ flexDirection: rowDirection }}>
            <SectionCard className="flex-1">
              <Text className="font-ui text-sm text-muted" style={{ textAlign }}>{t("home.habit")}</Text>
              <Text className="mt-2 font-uiSemibold text-lg text-text" style={{ textAlign }}>
                {formatStreakLabel(readingStreak, t)}
              </Text>
            </SectionCard>
            <Pressable className="flex-1 active:opacity-80" onPress={() => router.push("/bookmarks")}>
              <SectionCard>
                <Text className="font-ui text-sm text-muted" style={{ textAlign }}>{t("home.savedContent")}</Text>
                <Text className="mt-2 font-uiSemibold text-lg text-text" style={{ textAlign }}>
                  {t("home.savedVersesCount", { count: favorites.length })}
                </Text>
                <Text className="mt-1 font-ui text-sm text-muted" style={{ textAlign }}>
                  {t("home.bookmarksCount", { count: bookmarks.length })}
                </Text>
              </SectionCard>
            </Pressable>
          </View>

          <SectionCard>
            <View className="items-center justify-between" style={{ flexDirection: rowDirection }}>
              <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("home.featureShortcuts")}</Text>
              <StatusBadge label={t("home.dailyUse")} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
              {features.map((feature, index) => (
                <Pressable
                  key={feature.key}
                  className={`mr-3 w-28 rounded-3xl border border-border bg-bg px-4 py-4 active:opacity-80 ${
                    index === features.length - 1 ? "mr-0" : ""
                  }`}
                  onPress={feature.onPress}
                >
                  <MaterialCommunityIcons name={feature.icon} size={24} color={colors.primary} />
                  <Text className="mt-3 font-uiMedium text-sm text-text">{feature.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </SectionCard>

          <SectionCard>
            <View className="flex-row items-center justify-between">
              <Text className="font-uiSemibold text-base text-text">{t("readingPlan.title")}</Text>
              <StatusBadge
                label={readingPlanEnabled ? t("readingPlan.active") : t("readingPlan.inactive")}
                tone={readingPlanEnabled ? "success" : "accent"}
              />
            </View>
            <Text className="mt-2 font-ui text-sm leading-6 text-muted">
              {readingPlanEnabled
                ? t("readingPlan.progressLine", {
                    completed: readingPlanCompletedDays,
                    duration: readingPlanDurationDays,
                    percent: planPercent,
                    remaining: planRemainingDays,
                  })
                : t("readingPlan.startPrompt")}
            </Text>

            {readingPlanEnabled && expectedDateLabel ? (
              <Text className="mt-2 font-ui text-xs text-muted">{t("readingPlan.expectedFinish", { date: expectedDateLabel })}</Text>
            ) : null}
            {readingPlanEnabled && todayTargetLabel ? <Text className="mt-1 font-ui text-xs text-muted">{todayTargetLabel}</Text> : null}
            {readingPlanEnabled && paceLabel ? (
              <Text className="mt-1 font-ui text-xs text-muted">{t("readingPlan.paceLabel", { pace: paceLabel })}</Text>
            ) : null}
            {readingPlanPace?.status === "behind" ? (
              <Text className="mt-1 font-ui text-xs text-muted">
                {t("readingPlan.catchUpSuggestion", { count: readingPlanPace.catchUpDays })}
              </Text>
            ) : null}

            <View className="mt-4 flex-row gap-3">
              <ActionButton
                label={t("readingPlan.durationLabel", { days: readingPlanDurationDays })}
                variant="secondary"
                className="flex-1"
                onPress={() => {
                  const nextDuration = readingPlanDurationDays === 30 ? 60 : readingPlanDurationDays === 60 ? 90 : 30;
                  setReadingPlanDuration(nextDuration);
                }}
              />
              <ActionButton
                label={
                  readingPlanEnabled
                    ? completedToday
                      ? t("readingPlan.completedToday")
                      : t("readingPlan.markTodayComplete")
                    : t("readingPlan.startPlan")
                }
                className="flex-1"
                onPress={() => {
                  if (readingPlanEnabled) {
                    if (completedToday) return;
                    markReadingDayComplete();
                    return;
                  }
                  startReadingPlan({ durationDays: readingPlanDurationDays });
                }}
              />
            </View>

            <View className="mt-3">
              <ActionButton label={t("readingPlan.managePlan")} variant="secondary" onPress={() => router.push("/settings/reading-plan")} />
            </View>
          </SectionCard>

          {readingPlanEnabled && weeklyReview ? (
            <SectionCard>
              <View className="flex-row items-center justify-between">
                <Text className="font-uiSemibold text-base text-text">{t("readingPlan.weeklyReviewTitle")}</Text>
                <StatusBadge label={`${weeklyReview.completedDaysThisWeek}/7`} tone="default" />
              </View>
              <Text className="mt-2 font-ui text-sm leading-6 text-muted">
                {t("readingPlan.weeklyReviewSummary", {
                  completed: weeklyReview.completedDaysThisWeek,
                  missed: weeklyReview.missedDaysThisWeek,
                })}
              </Text>
              <ReadingWeekStrip activityDays={readingActivityDays} now={now} />
              <Text className="mt-1 font-ui text-xs text-muted">
                {t("readingPlan.weeklyTargetPrefix", { days: weeklyReview.weeklyTargetDays })}
                {weeklyReview.suggestedCatchUpDays > 0
                  ? t("readingPlan.weeklyCatchUpSuffix", { count: weeklyReview.suggestedCatchUpDays })
                  : t("readingPlan.weeklyOnTargetSuffix")}
              </Text>
            </SectionCard>
          ) : null}

          <SectionCard>
            <View className="flex-row items-center justify-between">
              <Text className="font-uiSemibold text-base text-text">{t("readingPlan.milestonesTitle")}</Text>
              <StatusBadge label={`${unlockedMilestones.length}/${READING_MILESTONES.length}`} />
            </View>
            {unlockedMilestones.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {unlockedMilestones.map((milestone) => (
                  <View key={milestone.id} className="rounded-full border border-border bg-bg px-3 py-1.5">
                    <Text className="font-ui text-xs text-text">{milestoneLabelById[milestone.id]}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="mt-2 font-ui text-sm text-muted">
                {t("readingPlan.milestonesEmpty")}
              </Text>
            )}
          </SectionCard>

          <SectionCard>
            <View className="flex-row items-center justify-between">
              <Text className="font-uiSemibold text-base text-text">{t("readingPlan.planHistoryTitle")}</Text>
              <StatusBadge label={`${readingPlanHistory.length}`} tone="default" />
            </View>
            {recentPlanHistory.length > 0 ? (
              <View className="mt-3 gap-2">
                {recentPlanHistory.map((item) => (
                  <View key={item.id} className="rounded-2xl border border-border bg-bg px-3 py-2">
                    <Text className="font-uiMedium text-xs text-text">
                      {t("readingPlan.planHistoryEntry", {
                        completed: item.completedDays,
                        duration: item.durationDays,
                        status: item.completed ? t("readingPlan.statusCompleted") : t("readingPlan.statusRecorded"),
                      })}
                    </Text>
                    <Text className="mt-0.5 font-ui text-xs text-muted">
                      {item.startDate ?? "unknown"} {"->"} {item.endDate}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="mt-2 font-ui text-sm text-muted">
                {t("readingPlan.planHistoryEmpty")}
              </Text>
            )}
          </SectionCard>

          <SectionCard>
            <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("home.recitation")}</Text>
            {audioChapterId ? (
              <>
                <Text className="mt-2 font-ui text-sm leading-6 text-muted" style={{ textAlign }}>
                  {audioTitle ?? t("quran.surahOnlyReference", { chapterId: audioChapterId })} · {audioMode === "verse" ? t("home.verseByVerse") : t("home.fullSurah")}
                </Text>
                <Text className="mt-1 font-ui text-sm text-muted" style={{ textAlign }}>
                  {currentReciterName} · {isPlaying ? t("home.playing") : t("home.paused")}
                </Text>
                <View className="mt-4">
                  <ActionButton label={t("common.resume")} onPress={() => router.push("/player")} />
                </View>
              </>
            ) : (
              <EmptyState
                icon="play-circle-outline"
                title={t("home.noRecitationTitle")}
                body={t("home.noRecitationBody")}
                actionLabel={t("home.browseQuran")}
                onAction={() => router.push("/quran")}
              />
            )}
          </SectionCard>

          <SectionCard>
            <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("home.dailyReflection")}</Text>
            <Text className="mt-2 font-ui text-sm leading-6 text-muted" style={{ textAlign }}>
              {t("home.dailyReflectionBody")}
            </Text>
          </SectionCard>
        </View>
      </ScrollView>
    </Screen>
  );
}
