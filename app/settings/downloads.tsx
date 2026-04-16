import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { listDownloads, removeDownload, type OfflineDownloadItem } from "@/services/offlineContent";
import { useChaptersQuery, useRecitationsQuery, useTranslationsQuery } from "@/hooks/quranQueries";

function estimateSizeLabel(items: OfflineDownloadItem[]) {
  const estimatedMb = items.length * 4;
  return `${estimatedMb} MB estimated`;
}

export default function DownloadsScreen() {
  const [items, setItems] = useState<OfflineDownloadItem[] | null>(null);
  const [busy, setBusy] = useState(false);

  const chaptersQuery = useChaptersQuery({ language: "en" });
  const translationsQuery = useTranslationsQuery({ language: "en" });
  const recitationsQuery = useRecitationsQuery({ language: "en" });

  async function refresh() {
    setBusy(true);
    try {
      const next = await listDownloads();
      setItems(next);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  const chaptersById = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of chaptersQuery.data ?? []) map.set(c.id, c.name_simple);
    return map;
  }, [chaptersQuery.data]);

  const translationById = useMemo(() => {
    const map = new Map<number, string>();
    for (const t of translationsQuery.data ?? []) map.set(t.id, t.name);
    return map;
  }, [translationsQuery.data]);

  const reciterById = useMemo(() => {
    const map = new Map<number, string>();
    for (const r of recitationsQuery.data ?? []) map.set(r.id, r.reciter_name);
    return map;
  }, [recitationsQuery.data]);

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Downloads" subtitle="Manage offline Quran text and recitation audio." showBack />

      <SectionCard compact className="mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="font-uiSemibold text-base text-text">Offline library</Text>
            <Text className="mt-1 font-ui text-sm text-muted">
              {items ? `${items.length} items · ${estimateSizeLabel(items)}` : "Refreshing offline items..."}
            </Text>
          </View>
          <Pressable className="rounded-2xl bg-bg px-4 py-2 active:opacity-80" onPress={() => refresh()}>
            <Text className="font-uiSemibold text-sm text-text">{busy ? "Refreshing..." : "Refresh"}</Text>
          </Pressable>
        </View>
      </SectionCard>

      {items === null ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator />
          <Text className="mt-3 font-ui text-muted">Loading downloads...</Text>
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="download-circle-outline"
          title="No downloads yet"
          body="Open a Surah and use the audio card to download text and recitation for offline reading."
          actionLabel="Browse Quran"
          onAction={() => router.push("/quran")}
        />
      ) : (
        <FlatList
          className="mt-1"
          data={items}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const chapterName = chaptersById.get(item.chapterId) ?? `Surah ${item.chapterId}`;
            const translationName = translationById.get(item.translationId) ?? `#${item.translationId}`;
            const reciterName = reciterById.get(item.recitationId) ?? `#${item.recitationId}`;
            const contentLabel = `${item.textPath ? "Text" : ""}${item.textPath && item.audioPath ? " + " : ""}${item.audioPath ? "Audio" : ""}`;

            return (
              <Pressable
                className="rounded-3xl border border-border bg-surface px-5 py-5 active:opacity-80"
                onPress={() =>
                  router.push({
                    pathname: `/surah/${item.chapterId}`,
                    params: { verseKey: `${item.chapterId}:1` },
                  })
                }
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="font-uiSemibold text-base text-text">
                      {item.chapterId}. {chapterName}
                    </Text>
                    <Text className="mt-2 font-ui text-sm leading-6 text-muted">{translationName} · {reciterName}</Text>
                    <Text className="mt-1 font-ui text-xs text-muted">{contentLabel}</Text>
                  </View>

                  <Pressable
                    className="rounded-2xl border border-border bg-bg px-4 py-2 active:opacity-80"
                    onPress={async () => {
                      setBusy(true);
                      try {
                        await removeDownload({
                          chapterId: item.chapterId,
                          translationId: item.translationId,
                          recitationId: item.recitationId,
                        });
                        await refresh();
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Text className="font-uiSemibold text-sm text-danger">Remove</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
