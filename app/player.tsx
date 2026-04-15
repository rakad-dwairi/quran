import { Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { useAudioStore } from "@/store/audioStore";
import { formatMillis } from "@/utils/time";

export default function PlayerScreen() {
  const {
    mode,
    chapterId,
    title,
    isPlaying,
    isLoading,
    positionMillis,
    durationMillis,
    queue,
    queueIndex,
    togglePlayPause,
    stop,
    next,
    previous,
  } = useAudioStore();

  const progress = durationMillis ? Math.max(0, Math.min(1, positionMillis / durationMillis)) : 0;
  const currentVerseKey = mode === "verse" && queue ? queue[queueIndex]?.verseKey : null;

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />

      <AppHeader title="Player" subtitle={chapterId ? `Now playing • Surah ${chapterId}` : "Nothing playing"} showBack />

      {!chapterId ? (
        <View className="mt-6 rounded-2xl border border-border bg-surface px-4 py-6">
          <Text className="font-uiSemibold text-base text-text">No audio session</Text>
          <Text className="mt-2 font-ui text-muted">
            Open a Surah and press “Play Surah” or “Play Verses”.
          </Text>
        </View>
      ) : (
        <View className="rounded-2xl border border-border bg-surface p-5">
          <Text className="font-uiSemibold text-lg text-text">{title ?? `Surah ${chapterId}`}</Text>
          <Text className="mt-1 font-ui text-sm text-muted">
            {mode === "chapter" ? "Full Surah audio" : `Verse-by-verse${currentVerseKey ? ` • ${currentVerseKey}` : ""}`}
          </Text>

          <View className="mt-5 h-1 overflow-hidden rounded-full bg-border">
            <View className="h-1 rounded-full bg-primary" style={{ width: `${Math.round(progress * 100)}%` }} />
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="font-ui text-xs text-muted">
              {formatMillis(positionMillis)} / {formatMillis(durationMillis)}
            </Text>
            {isLoading ? (
              <Text className="font-ui text-xs text-muted">Loading…</Text>
            ) : (
              <Text className="font-ui text-xs text-muted">{isPlaying ? "Playing" : "Paused"}</Text>
            )}
          </View>

          <View className="mt-6 flex-row items-center justify-between">
            <Pressable
              className={`rounded-2xl px-5 py-3 active:opacity-80 ${mode === "verse" ? "bg-bg" : "bg-border"}`}
              onPress={() => previous()}
              disabled={mode !== "verse"}
            >
              <Text className="font-uiSemibold text-sm text-text">Prev</Text>
            </Pressable>

            <Pressable
              className="rounded-2xl bg-primary px-8 py-3 active:opacity-80"
              onPress={() => togglePlayPause()}
            >
              <Text className="font-uiSemibold text-sm text-primaryForeground">{isPlaying ? "Pause" : "Play"}</Text>
            </Pressable>

            <Pressable
              className={`rounded-2xl px-5 py-3 active:opacity-80 ${mode === "verse" ? "bg-bg" : "bg-border"}`}
              onPress={() => next()}
              disabled={mode !== "verse"}
            >
              <Text className="font-uiSemibold text-sm text-text">Next</Text>
            </Pressable>
          </View>

          <Pressable className="mt-4 items-center" onPress={() => stop()}>
            <Text className="font-uiSemibold text-danger">Stop</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}
