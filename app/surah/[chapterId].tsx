import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { MushafPage } from "@/components/MushafPage";
import { Screen } from "@/components/Screen";
import { SurahAudioControls } from "@/components/SurahAudioControls";
import { VerseActionsSheet } from "@/components/VerseActionsSheet";
import { VerseRow } from "@/components/VerseRow";
import { useChapterAudioQuery, useChapterVersesQuery, useChaptersQuery } from "@/hooks/quranQueries";
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
    recitationId,
    showTranslation,
    arabicFontSize,
    translationFontSize,
    verseLayout,
  } = useSettingsStore();

  const chaptersQuery = useChaptersQuery({ language: "en" });
  const chapter = useMemo(
    () => chaptersQuery.data?.find((c) => c.id === chapterId),
    [chaptersQuery.data, chapterId]
  );

  const versesQuery = useChapterVersesQuery({
    chapterId,
    translationId,
    recitationId,
    language: "en",
  });

  const [offlineVerses, setOfflineVerses] = useState<Verse[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    getOfflineSurahVerses({ chapterId, translationId })
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

      const t = setTimeout(() => {
        pageListRef.current?.scrollToIndex({ index: pageIndex, animated: true });
      }, 300);

      return () => clearTimeout(t);
    }

    const index = verses.findIndex((v) => v.verse_key === highlightKey);
    if (index < 0) return;

    const t = setTimeout(() => {
      verseListRef.current?.scrollToIndex({ index, animated: true });
    }, 300);

    return () => clearTimeout(t);
  }, [highlightKey, offlineVerses, verseLayout, versesQuery.data]);

  const verses = versesQuery.data ?? offlineVerses ?? [];
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

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />

      <AppHeader
        title={chapter?.name_simple ? `${chapter.id}. ${chapter.name_simple}` : `Surah ${chapterId}`}
        subtitle={chapter?.name_arabic}
        showBack
        right={<NowPlayingButton />}
      />

      <SurahAudioControls
        chapterId={chapterId}
        title={chapter?.name_simple ? chapter.name_simple : `Surah ${chapterId}`}
        verses={versesQuery.data ?? offlineVerses}
        chapterAudioUrl={chapterAudioQuery.data?.audio_url}
        startVerseKey={highlightKey}
      />

      <View className="h-4" />

      {versesQuery.isLoading ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator />
          <Text className="mt-3 font-ui text-muted">Loading verses…</Text>
        </View>
      ) : versesQuery.isError && !offlineVerses ? (
        <View className="flex-1 items-center justify-center py-10">
          <Text className="font-uiSemibold text-base text-text">Couldn’t load verses</Text>
          <Text className="mt-2 text-center font-ui text-muted">
            Check your connection and try again.
          </Text>
          <Pressable
            className="mt-5 rounded-2xl bg-primary px-5 py-3"
            onPress={() => versesQuery.refetch()}
          >
            <Text className="font-uiSemibold text-primaryForeground">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-1">
          {verseLayout === "mushaf" ? (
            <FlatList
              ref={pageListRef}
              data={mushafPages}
              keyExtractor={(item) => (item.pageNumber ? `p${item.pageNumber}` : "p-unknown")}
              contentContainerStyle={{ paddingBottom: 24 }}
              ItemSeparatorComponent={() => <View className="h-4" />}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  pageListRef.current?.scrollToIndex({ index: info.index, animated: true });
                }, 300);
              }}
              ListHeaderComponent={
                <View>
                  <View className="mb-3 rounded-2xl border border-border bg-surface px-4 py-3">
                    <Text className="font-uiSemibold text-sm text-text">Mushaf page view</Text>
                    <Text className="mt-1 font-ui text-sm text-muted">
                      Printed-page style. Tap any verse to bookmark, favorite, or open tafsir.
                    </Text>
                  </View>
                  {versesQuery.data ? null : offlineVerses ? (
                    <View className="mb-3 rounded-2xl border border-border bg-surface px-4 py-3">
                      <Text className="font-uiSemibold text-sm text-text">Offline copy</Text>
                      <Text className="mt-1 font-ui text-sm text-muted">
                        Showing downloaded text. Connect to update.
                      </Text>
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
              ItemSeparatorComponent={() => <View className="h-3" />}
              onScrollToIndexFailed={(info) => {
                // If layout isn't measured yet, try again shortly.
                setTimeout(() => {
                  verseListRef.current?.scrollToIndex({ index: info.index, animated: true });
                }, 300);
              }}
              ListHeaderComponent={
                versesQuery.data ? null : offlineVerses ? (
                  <View className="mb-3 rounded-2xl border border-border bg-surface px-4 py-3">
                    <Text className="font-uiSemibold text-sm text-text">Offline copy</Text>
                    <Text className="mt-1 font-ui text-sm text-muted">
                      Showing downloaded text. Connect to update.
                    </Text>
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <VerseRow
                  verse={item}
                  showTranslation={showTranslation}
                  arabicFontSize={arabicFontSize}
                  translationFontSize={translationFontSize}
                  highlighted={item.verse_key === highlightedVerseKey}
                />
              )}
            />
          )}

          <VerseActionsSheet
            open={verseLayout === "mushaf" && !!actionsVerse}
            verse={actionsVerse}
            onClose={() => setActionsVerse(null)}
            showTranslation={showTranslation}
            arabicFontSize={arabicFontSize}
            translationFontSize={translationFontSize}
          />
        </View>
      )}
    </Screen>
  );
}
