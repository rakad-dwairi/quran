import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { useChaptersQuery } from "@/hooks/quranQueries";
import { useLibraryStore } from "@/store/libraryStore";
import { colors } from "@/theme/colors";

function formatDate(value: number | undefined) {
  if (!value) return "Not reviewed yet";
  return new Date(value).toLocaleDateString();
}

export default function MemorizationScreen() {
  const [hideText, setHideText] = useState(false);
  const memorizedMap = useLibraryStore((s) => s.memorized);
  const markReviewed = useLibraryStore((s) => s.markMemorizedReviewed);
  const toggleMemorized = useLibraryStore((s) => s.toggleMemorized);
  const chaptersQuery = useChaptersQuery({ language: "en" });

  const chaptersById = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of chaptersQuery.data ?? []) map.set(c.id, c.name_simple);
    return map;
  }, [chaptersQuery.data]);

  const items = useMemo(
    () => Object.values(memorizedMap).sort((a, b) => (a.lastReviewedAt ?? 0) - (b.lastReviewedAt ?? 0)),
    [memorizedMap]
  );

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Memorization" subtitle="Review saved ayahs, hide the text, and track repetitions." showBack />

      {items.length === 0 ? (
        <EmptyState
          icon="brain"
          title="No memorized verses yet"
          body="Open any verse, tap actions, and mark it as memorized. Your review list will appear here."
          actionLabel="Browse Quran"
          onAction={() => router.push("/quran")}
        />
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="rounded-2xl border border-border bg-surface px-4 py-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="font-uiSemibold text-base text-text">Review mode</Text>
                <Text className="mt-1 font-ui text-sm text-muted">
                  Hide text first, recite from memory, then reveal and mark reviewed.
                </Text>
              </View>
              <Pressable
                className="rounded-2xl bg-primary px-4 py-3 active:opacity-80"
                onPress={() => setHideText((value) => !value)}
              >
                <Text className="font-uiSemibold text-sm text-primaryForeground">
                  {hideText ? "Reveal" : "Hide"}
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="mt-4 gap-3">
            {items.map((item) => {
              const chapterName = chaptersById.get(item.chapterId) ?? `Surah ${item.chapterId}`;
              return (
                <View key={item.verseKey} className="rounded-3xl border border-border bg-surface px-5 py-5">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="font-uiSemibold text-sm text-text">
                        {item.verseKey} · {chapterName}
                      </Text>
                      <Text className="mt-1 font-ui text-xs text-muted">
                        Reviewed {item.reviewCount} times · {formatDate(item.lastReviewedAt)}
                      </Text>
                    </View>
                    <Pressable
                      className="rounded-2xl bg-bg px-3 py-2 active:opacity-80"
                      onPress={() => router.push({ pathname: `/surah/${item.chapterId}`, params: { verseKey: item.verseKey } })}
                    >
                      <Text className="font-uiMedium text-xs text-text">Open</Text>
                    </Pressable>
                  </View>

                  {hideText ? (
                    <View className="mt-4 rounded-2xl border border-border bg-bg px-4 py-6">
                      <Text className="text-center font-uiMedium text-sm text-muted">Hidden for recall</Text>
                    </View>
                  ) : (
                    <>
                      <Text
                        className="mt-4 font-arabic text-text"
                        style={{ writingDirection: "rtl", textAlign: "right", fontSize: 26, lineHeight: 50 }}
                      >
                        {item.arabicText}
                      </Text>
                      {item.translationText ? (
                        <Text className="mt-3 font-serif text-sm leading-6 text-muted">{item.translationText}</Text>
                      ) : null}
                    </>
                  )}

                  <View className="mt-4 flex-row gap-3">
                    <Pressable
                      className="flex-1 rounded-2xl bg-primary px-4 py-3 active:opacity-80"
                      onPress={() => markReviewed(item.verseKey)}
                    >
                      <Text className="text-center font-uiSemibold text-sm text-primaryForeground">Mark reviewed</Text>
                    </Pressable>
                    <Pressable
                      className="rounded-2xl border border-border bg-bg px-4 py-3 active:opacity-80"
                      onPress={() => toggleMemorized(item)}
                    >
                      <Text className="font-uiSemibold text-sm" style={{ color: colors.danger }}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
