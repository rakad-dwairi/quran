import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
import { SurahAudioControls } from "@/components/SurahAudioControls";
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

  const listRef = useRef<FlatList<Verse>>(null);
  const highlightKey = typeof verseKey === "string" ? verseKey : undefined;
  const [highlightedVerseKey, setHighlightedVerseKey] = useState<string | undefined>(highlightKey);

  useEffect(() => {
    setHighlightedVerseKey(highlightKey);
  }, [highlightKey]);

  useEffect(() => {
    if (!highlightKey) return;
    if (!versesQuery.data) return;
    const index = versesQuery.data.findIndex((v) => v.verse_key === highlightKey);
    if (index < 0) return;

    const t = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: true });
    }, 300);

    return () => clearTimeout(t);
  }, [highlightKey, versesQuery.data]);

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
        <FlatList
          ref={listRef}
          data={versesQuery.data ?? offlineVerses ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          onScrollToIndexFailed={(info) => {
            // If layout isn't measured yet, try again shortly.
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index: info.index, animated: true });
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
    </Screen>
  );
}
