import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { listDownloads, removeDownload, type OfflineDownloadItem } from "@/services/offlineContent";
import { useChaptersQuery, useRecitationsQuery, useTranslationsQuery } from "@/hooks/quranQueries";

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
      <AppHeader title="Downloads" subtitle="Manage offline text and audio." showBack />

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="font-ui text-sm text-muted">
          {items ? `${items.length} item${items.length === 1 ? "" : "s"}` : "—"}
        </Text>
        <Pressable className="active:opacity-70" onPress={() => refresh()}>
          <Text className="font-uiSemibold text-primary">{busy ? "Refreshing…" : "Refresh"}</Text>
        </Pressable>
      </View>

      {items === null ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator />
          <Text className="mt-3 font-ui text-muted">Loading downloads…</Text>
        </View>
      ) : items.length === 0 ? (
        <View className="mt-6 rounded-2xl border border-border bg-surface px-4 py-6">
          <Text className="font-uiSemibold text-base text-text">No downloads yet</Text>
          <Text className="mt-2 font-ui text-muted">
            Open a Surah and press “Download” in the Audio card.
          </Text>
        </View>
      ) : (
        <FlatList
          className="mt-4"
          data={items}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View className="h-2" />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const chapterName = chaptersById.get(item.chapterId) ?? `Surah ${item.chapterId}`;
            const translationName = translationById.get(item.translationId) ?? `#${item.translationId}`;
            const reciterName = reciterById.get(item.recitationId) ?? `#${item.recitationId}`;

            return (
              <Pressable
                className="rounded-2xl border border-border bg-surface px-4 py-4 active:opacity-80"
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
                    <Text className="mt-1 font-ui text-sm text-muted" numberOfLines={1}>
                      {translationName} • {reciterName}
                    </Text>
                    <Text className="mt-1 font-ui text-xs text-muted">
                      {item.textPath ? "Text" : ""}{item.textPath && item.audioPath ? " + " : ""}{item.audioPath ? "Audio" : ""}
                    </Text>
                  </View>

                  <Pressable
                    className="rounded-2xl bg-bg px-4 py-2 active:opacity-80"
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
