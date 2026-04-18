import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewToken } from "react-native";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { AppHeader } from "@/components/AppHeader";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { MushafPage } from "@/components/MushafPage";
import { Screen } from "@/components/Screen";
import { SurahAudioControls } from "@/components/SurahAudioControls";
import { VerseActionsSheet } from "@/components/VerseActionsSheet";
import { VerseRow } from "@/components/VerseRow";
import { useChapterAudioQuery, useChapterVersesQuery, useChaptersQuery } from "@/hooks/quranQueries";
import { useAppLocale } from "@/i18n/useAppLocale";
import type { Verse } from "@/services/quranComApi";
import { getOfflineSurahVerses } from "@/services/offlineContent";
import { useSettingsStore } from "@/store/settingsStore";

export default function SurahScreen() {
  const { chapterId: chapterIdParam, verseKey } = useLocalSearchParams<{
    chapterId: string;
    verseKey?: string;
  }>();

  const chapterId = Number(chapterIdParam);
  const {
    translationId,
    quranTranslationLanguage,
    recitationId,
    showTranslation,
    showTransliteration,
    arabicFontSize,
    translationFontSize,
    verseLayout,
    recordReadingProgress,
  } = useSettingsStore(
    useShallow((state) => ({
      translationId: state.translationId,
      quranTranslationLanguage: state.quranTranslationLanguage,
      recitationId: state.recitationId,
      showTranslation: state.showTranslation,
      showTransliteration: state.showTransliteration,
      arabicFontSize: state.arabicFontSize,
      translationFontSize: state.translationFontSize,
      verseLayout: state.verseLayout,
      recordReadingProgress: state.recordReadingProgress,
    }))
  );
  const { t } = useAppLocale();

  const chaptersQuery = useChaptersQuery({ language: "en" });
  const chapter = useMemo(
    () => chaptersQuery.data?.find((c) => c.id === chapterId),
    [chaptersQuery.data, chapterId]
  );

  const versesQuery = useChapterVersesQuery({
    chapterId,
    translationId: showTranslation ? translationId : null,
    recitationId,
    language: quranTranslationLanguage === "es" ? "es" : "en",
    includeTransliteration: showTransliteration,
  });

  const [offlineVerses, setOfflineVerses] = useState<Verse[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    getOfflineSurahVerses({ chapterId, translationId: translationId ?? 85 })
      .then((v) => {
        if (!cancelled) setOfflineVerses(v);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [chapterId, translationId]);

  const chapterAudioQuery = useChapterAudioQuery({
    chapterId,
    recitationId,
  });

  const verseListRef = useRef<FlatList<Verse>>(null);
  const pageListRef = useRef<FlatList<{ pageNumber: number | null; verses: Verse[] }>>(null);
  const highlightKey = typeof verseKey === "string" ? verseKey : undefined;
  const [highlightedVerseKey, setHighlightedVerseKey] = useState<string | undefined>(highlightKey);
  const [actionsVerse, setActionsVerse] = useState<Verse | null>(null);
  const [currentVerseKey, setCurrentVerseKey] = useState<string | null>(highlightKey ?? null);

  useEffect(() => {
    setHighlightedVerseKey(highlightKey);
  }, [highlightKey]);

  useEffect(() => {
    if (!highlightKey) return;
    const verses = versesQuery.data ?? offlineVerses;
    if (!verses) return;

    if (verseLayout === "mushaf") {
      const match = verses.find((v) => v.verse_key === highlightKey);
      const pageNumber = match?.page_number ?? null;
      if (!pageNumber) return;

      const pageIndex = (() => {
        let i = 0;
        const seen = new Set<number>();
        for (const v of verses) {
          const p = v.page_number;
          if (!p || seen.has(p)) continue;
          seen.add(p);
          if (p === pageNumber) return i;
          i += 1;
        }
        return -1;
      })();
      if (pageIndex < 0) return;

      const timer = setTimeout(() => {
        pageListRef.current?.scrollToIndex({ index: pageIndex, animated: true });
      }, 300);

      return () => clearTimeout(timer);
    }

    const index = verses.findIndex((v) => v.verse_key === highlightKey);
    if (index < 0) return;

    const timer = setTimeout(() => {
      verseListRef.current?.scrollToIndex({ index, animated: true });
    }, 300);

    return () => clearTimeout(timer);
  }, [highlightKey, offlineVerses, verseLayout, versesQuery.data]);

  const verses = versesQuery.data ?? offlineVerses ?? [];
  const lastRecordedVerseKeyRef = useRef<string | null>(null);

  useEffect(() => {
    lastRecordedVerseKeyRef.current = null;
  }, [chapterId, verseLayout]);

  function captureReadingProgress(nextVerseKey: string | undefined) {
    if (!nextVerseKey) return;
    if (lastRecordedVerseKeyRef.current === nextVerseKey) return;
    lastRecordedVerseKeyRef.current = nextVerseKey;
    setCurrentVerseKey(nextVerseKey);
    recordReadingProgress({ chapterId, verseKey: nextVerseKey });
  }

  useEffect(() => {
    const fallbackVerseKey = highlightKey ?? verses[0]?.verse_key;
    captureReadingProgress(fallbackVerseKey);
  }, [chapterId, highlightKey, verses, recordReadingProgress]);

  const onVerseViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const verse = viewableItems.find((item) => item.isViewable)?.item as Verse | undefined;
      captureReadingProgress(verse?.verse_key);
    }
  );

  const mushafPages = useMemo(() => {
    const map = new Map<number, Verse[]>();
    for (const v of verses) {
      const p = v.page_number;
      if (!p) continue;
      const bucket = map.get(p);
      if (bucket) bucket.push(v);
      else map.set(p, [v]);
    }

    if (map.size === 0) {
      return [{ pageNumber: null, verses }];
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pageNumber, pageVerses]) => ({ pageNumber, verses: pageVerses }));
  }, [verses]);

  const onMushafPagesViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const item = viewableItems.find((token) => token.isViewable)?.item as
        | { pageNumber: number | null; verses: Verse[] }
        | undefined;
      captureReadingProgress(item?.verses[0]?.verse_key);
    }
  );

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />

      <AppHeader
        title={chapter?.name_simple ? `${chapter.id}. ${chapter.name_simple}` : t("surah.titleFallback", { chapterId })}
        subtitle={chapter?.name_arabic}
        showBack
        right={<NowPlayingButton />}
      />

      <SurahAudioControls
        chapterId={chapterId}
        title={chapter?.name_simple ? chapter.name_simple : t("surah.titleFallback", { chapterId })}
        verses={versesQuery.data ?? offlineVerses}
        chapterAudioUrl={chapterAudioQuery.data?.audio_url}
        startVerseKey={highlightKey}
      />

      <View className="h-4" />

      {versesQuery.isLoading ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator />
          <Text className="mt-3 font-ui text-muted">{t("surah.loadingVerses")}</Text>
        </View>
      ) : versesQuery.isError && !offlineVerses ? (
        <View className="flex-1 items-center justify-center py-10">
          <Text className="font-uiSemibold text-base text-text">{t("surah.loadErrorTitle")}</Text>
          <Text className="mt-2 text-center font-ui text-muted">{t("surah.loadErrorBody")}</Text>
          <Pressable className="mt-5 rounded-2xl bg-primary px-5 py-3" onPress={() => versesQuery.refetch()}>
            <Text className="font-uiSemibold text-primaryForeground">{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-1">
          {currentVerseKey ? (
            <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
              <Text className="font-uiMedium text-xs text-muted">Current position</Text>
              <Text className="font-uiSemibold text-xs text-primary">{currentVerseKey}</Text>
            </View>
          ) : null}

          {verseLayout === "mushaf" ? (
            <FlatList
              ref={pageListRef}
              data={mushafPages}
              keyExtractor={(item) => (item.pageNumber ? `p${item.pageNumber}` : "p-unknown")}
              contentContainerStyle={{ paddingBottom: 24 }}
              onViewableItemsChanged={onMushafPagesViewableItemsChanged.current}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              ItemSeparatorComponent={() => <View className="h-4" />}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  pageListRef.current?.scrollToIndex({ index: info.index, animated: true });
                }, 300);
              }}
              ListHeaderComponent={
                <View>
                  <View className="mb-3 rounded-2xl border border-border bg-surface px-4 py-3">
                    <Text className="font-uiSemibold text-sm text-text">{t("surah.mushafView")}</Text>
                    <Text className="mt-1 font-ui text-sm text-muted">{t("surah.mushafViewBody")}</Text>
                  </View>
                  {versesQuery.data ? null : offlineVerses ? (
                    <View className="mb-3 rounded-2xl border border-border bg-surface px-4 py-3">
                      <Text className="font-uiSemibold text-sm text-text">{t("surah.offlineCopy")}</Text>
                      <Text className="mt-1 font-ui text-sm text-muted">{t("surah.offlineCopyBody")}</Text>
                    </View>
                  ) : null}
                </View>
              }
              renderItem={({ item }) => (
                <MushafPage
                  pageNumber={item.pageNumber}
                  verses={item.verses}
                  arabicFontSize={arabicFontSize}
                  highlightedVerseKey={highlightedVerseKey}
                  onPressVerse={(v) => setActionsVerse(v)}
                />
              )}
            />
          ) : (
            <FlatList
              ref={verseListRef}
              data={verses}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingBottom: 24 }}
              onViewableItemsChanged={onVerseViewableItemsChanged.current}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              ItemSeparatorComponent={() => <View className="h-3" />}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  verseListRef.current?.scrollToIndex({ index: info.index, animated: true });
                }, 300);
              }}
              ListHeaderComponent={
                versesQuery.data ? null : offlineVerses ? (
                  <View className="mb-3 rounded-2xl border border-border bg-surface px-4 py-3">
                    <Text className="font-uiSemibold text-sm text-text">{t("surah.offlineCopy")}</Text>
                    <Text className="mt-1 font-ui text-sm text-muted">{t("surah.offlineCopyBody")}</Text>
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <VerseRow
                  verse={item}
                  showTranslation={showTranslation}
                  showTransliteration={showTransliteration}
                  arabicFontSize={arabicFontSize}
                  translationFontSize={translationFontSize}
                  highlighted={item.verse_key === highlightedVerseKey}
                  onOpenActions={(v) => setActionsVerse(v)}
                />
              )}
            />
          )}

          <VerseActionsSheet
            open={!!actionsVerse}
            verse={actionsVerse}
            onClose={() => setActionsVerse(null)}
            showTranslation={showTranslation}
            showTransliteration={showTransliteration}
            arabicFontSize={arabicFontSize}
            translationFontSize={translationFontSize}
            verses={verses}
            chapterTitle={chapter?.name_simple ? chapter.name_simple : t("surah.titleFallback", { chapterId })}
          />
        </View>
      )}
    </Screen>
  );
}
