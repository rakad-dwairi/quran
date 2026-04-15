import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
import { SearchResultItem } from "@/components/SearchResultItem";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useChaptersQuery, useSearchQuery } from "@/hooks/quranQueries";
import type { SearchResult } from "@/services/quranComApi";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";

function parseVerseKey(input: string): string | null {
  const trimmed = input.trim();
  const m = /^(\d{1,3})\s*[:\s]\s*(\d{1,3})$/.exec(trimmed);
  if (!m) return null;
  const chapter = Number(m[1]);
  const verse = Number(m[2]);
  if (!Number.isFinite(chapter) || !Number.isFinite(verse)) return null;
  if (chapter < 1 || chapter > 114) return null;
  if (verse < 1 || verse > 300) return null;
  return `${chapter}:${verse}`;
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 350);
  const trimmed = debounced.trim();

  const { translationId } = useSettingsStore();
  const chaptersQuery = useChaptersQuery({ language: "en" });

  const searchQuery = useSearchQuery({
    query: debounced,
    translationId,
    page: 1,
    size: 20,
    language: "en",
  });

  const results = useMemo<SearchResult[]>(() => searchQuery.data?.results ?? [], [searchQuery.data]);
  const surahMatches = useMemo(() => {
    if (!trimmed) return [];
    const list = chaptersQuery.data ?? [];
    const lower = trimmed.toLowerCase();
    return list
      .filter((c) => c.name_simple.toLowerCase().includes(lower) || c.name_arabic.includes(trimmed))
      .slice(0, 5);
  }, [chaptersQuery.data, trimmed]);

  return (
    <Screen className="pt-6">
      <AppHeader
        title="Search"
        subtitle="Find verses by keyword, Surah, or verse number."
        right={<NowPlayingButton />}
      />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search (e.g., mercy) or jump (e.g., 2:255)"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={() => {
          const key = parseVerseKey(query);
          if (!key) return;
          const chapter = Number(key.split(":")[0]);
          router.push({ pathname: `/surah/${chapter}`, params: { verseKey: key } });
        }}
        className="rounded-2xl border border-border bg-surface px-4 py-3 font-ui text-base text-text"
      />

      {trimmed.length === 0 ? (
        <View className="mt-6 rounded-2xl border border-border bg-surface px-4 py-4">
          <Text className="font-uiSemibold text-base text-text">Tips</Text>
          <Text className="mt-2 font-ui text-muted">
            - Use keywords (English) like "mercy"{`\n`}- Jump to an ayah like "2:255"
          </Text>
        </View>
      ) : (
        <>
          {surahMatches.length ? (
            <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4">
              <Text className="font-uiSemibold text-base text-text">Surahs</Text>
              <View className="mt-3">
                {surahMatches.map((c) => (
                  <Pressable
                    key={c.id}
                    className="flex-row items-center justify-between py-2 active:opacity-80"
                    onPress={() => router.push(`/surah/${c.id}`)}
                  >
                    <Text className="font-uiMedium text-sm text-text">
                      {c.id}. {c.name_simple}
                    </Text>
                    <Text className="font-arabic text-base text-text">{c.name_arabic}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {searchQuery.isLoading ? (
            <View className="flex-1 items-center justify-center py-10">
              <ActivityIndicator />
              <Text className="mt-3 font-ui text-muted">Searching…</Text>
            </View>
          ) : searchQuery.isError ? (
            <View className="mt-6 rounded-2xl border border-border bg-surface px-4 py-4">
              <Text className="font-uiSemibold text-base text-text">Search failed</Text>
              <Text className="mt-2 font-ui text-muted">Check your connection and try again.</Text>
              <Pressable
                className="mt-4 self-start rounded-2xl bg-primary px-4 py-2"
                onPress={() => searchQuery.refetch()}
              >
                <Text className="font-uiSemibold text-white">Retry</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              className="mt-4"
              data={results}
              keyExtractor={(item) => String(item.verse_id)}
              ItemSeparatorComponent={() => <View className="h-3" />}
              contentContainerStyle={{ paddingBottom: 24 }}
              ListEmptyComponent={
                <View className="mt-6 rounded-2xl border border-border bg-surface px-4 py-4">
                  <Text className="font-uiSemibold text-base text-text">No results</Text>
                  <Text className="mt-2 font-ui text-muted">
                    Try different keywords or jump using a verse number like "2:255".
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const chapter = Number(item.verse_key.split(":")[0]);
                return (
                  <Pressable
                    className="active:opacity-80"
                    onPress={() =>
                      router.push({ pathname: `/surah/${chapter}`, params: { verseKey: item.verse_key } })
                    }
                  >
                    <SearchResultItem result={item} />
                  </Pressable>
                );
              }}
            />
          )}
        </>
      )}
    </Screen>
  );
}
