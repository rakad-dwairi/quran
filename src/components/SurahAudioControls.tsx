import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import type { Verse } from "@/services/quranComApi";
import {
  downloadSurahBundle,
  getOfflineChapterAudioPath,
  isSurahDownloaded,
  removeDownload,
} from "@/services/offlineContent";
import { useAudioStore } from "@/store/audioStore";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";
import { formatMillis } from "@/utils/time";

export function SurahAudioControls({
  chapterId,
  title,
  verses,
  chapterAudioUrl,
  startVerseKey,
}: {
  chapterId: number;
  title: string;
  verses: Verse[] | null | undefined;
  chapterAudioUrl: string | null | undefined;
  startVerseKey?: string;
}) {
  const {
    mode,
    chapterId: playingChapterId,
    title: playingTitle,
    isPlaying,
    isLoading,
    positionMillis,
    durationMillis,
    queue,
    queueIndex,
    error,
    playChapter,
    playVerseQueue,
    togglePlayPause,
    stop,
    next,
    previous,
  } = useAudioStore();

  const { translationId, recitationId } = useSettingsStore();
  const effectiveTranslationId = translationId ?? 85;

  const isThisChapter = playingChapterId === chapterId;
  const isChapterMode = isThisChapter && mode === "chapter";
  const isVerseMode = isThisChapter && mode === "verse";

  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isSurahDownloaded({ chapterId, translationId: effectiveTranslationId, recitationId })
      .then((ok) => {
        if (!cancelled) setDownloaded(ok);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [chapterId, effectiveTranslationId, recitationId]);

  const progress = useMemo(() => {
    if (!durationMillis) return 0;
    return Math.max(0, Math.min(1, positionMillis / durationMillis));
  }, [positionMillis, durationMillis]);

  const currentVerseLabel = useMemo(() => {
    if (!isVerseMode || !queue) return null;
    return queue[queueIndex]?.verseKey ?? null;
  }, [isVerseMode, queue, queueIndex]);

  return (
    <View className="rounded-2xl border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-uiSemibold text-base text-text">Audio</Text>
        <View className="flex-row items-center gap-3">
          <Pressable
            className="active:opacity-70"
            onPress={async () => {
              if (downloading) return;
              if (downloaded) {
                Alert.alert("Remove download?", "This will delete offline text and audio for this Surah.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                      setDownloading(true);
                      try {
                        await removeDownload({ chapterId, translationId: effectiveTranslationId, recitationId });
                        setDownloaded(false);
                      } finally {
                        setDownloading(false);
                      }
                    },
                  },
                ]);
                return;
              }

              if (!verses?.length) return;
              setDownloading(true);
              try {
                await downloadSurahBundle({
                  chapterId,
                  translationId: effectiveTranslationId,
                  recitationId,
                  verses,
                  audioUrl: chapterAudioUrl ?? undefined,
                });
                setDownloaded(true);
              } catch (e) {
                Alert.alert("Download failed", e instanceof Error ? e.message : "Please try again.");
              } finally {
                setDownloading(false);
              }
            }}
          >
            <Text className="font-uiSemibold text-sm text-primary">
              {downloading ? "Working…" : downloaded ? "Remove" : "Download"}
            </Text>
          </Pressable>

          {isThisChapter ? (
            <Pressable className="active:opacity-70" onPress={() => stop()}>
              <Text className="font-uiSemibold text-danger">Stop</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? (
        <Text className="mt-2 font-ui text-sm text-danger">{error}</Text>
      ) : null}

      <View className="mt-4 flex-row gap-3">
        <Pressable
          className={`flex-1 rounded-2xl px-4 py-3 active:opacity-80 ${
            isChapterMode ? "bg-primaryMuted" : "bg-bg"
          }`}
          onPress={async () => {
            if (isChapterMode) {
              await togglePlayPause();
              return;
            }
            if (!chapterAudioUrl) return;
            const offlinePath = await getOfflineChapterAudioPath({ chapterId, recitationId });
            await playChapter({ chapterId, title, uri: offlinePath ?? chapterAudioUrl });
          }}
          disabled={!isChapterMode && !chapterAudioUrl}
        >
          <Text className="font-uiSemibold text-sm text-text">
            {isChapterMode ? (isPlaying ? "Pause Surah" : "Resume Surah") : "Play Surah"}
          </Text>
          <Text className="mt-1 font-ui text-xs text-muted">Full Surah audio</Text>
        </Pressable>

        <Pressable
          className={`flex-1 rounded-2xl px-4 py-3 active:opacity-80 ${
            isVerseMode ? "bg-primaryMuted" : "bg-bg"
          }`}
          onPress={async () => {
            if (isVerseMode) {
              await togglePlayPause();
              return;
            }
            if (!verses?.length) return;
            await playVerseQueue({ chapterId, title, verses, startVerseKey });
          }}
          disabled={!isVerseMode && !verses?.length}
        >
          <Text className="font-uiSemibold text-sm text-text">
            {isVerseMode ? (isPlaying ? "Pause Verses" : "Resume Verses") : "Play Verses"}
          </Text>
          <Text className="mt-1 font-ui text-xs text-muted">Verse-by-verse</Text>
        </Pressable>
      </View>

      {isThisChapter ? (
        <View className="mt-4">
          <View className="h-1 overflow-hidden rounded-full bg-border">
            <View
              className="h-1 rounded-full bg-primary"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="font-ui text-xs text-muted">
              {formatMillis(positionMillis)} / {formatMillis(durationMillis)}
            </Text>
            {isLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color={colors.muted} />
                <Text className="ml-2 font-ui text-xs text-muted">Loading…</Text>
              </View>
            ) : isVerseMode && queue ? (
              <Text className="font-ui text-xs text-muted">
                {currentVerseLabel ? `Now: ${currentVerseLabel}` : playingTitle}
              </Text>
            ) : (
              <Text className="font-ui text-xs text-muted">{playingTitle}</Text>
            )}
          </View>

          {isVerseMode ? (
            <View className="mt-3 flex-row items-center justify-between">
              <Pressable
                className="rounded-2xl bg-bg px-4 py-2 active:opacity-80"
                onPress={() => previous()}
              >
                <Text className="font-uiSemibold text-sm text-text">Prev</Text>
              </Pressable>
              <Pressable
                className="rounded-2xl bg-bg px-4 py-2 active:opacity-80"
                onPress={() => next()}
              >
                <Text className="font-uiSemibold text-sm text-text">Next</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
