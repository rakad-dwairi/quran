import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { AppHeader } from "@/components/AppHeader";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
import { SearchResultItem } from "@/components/SearchResultItem";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useChaptersQuery, useSearchQuery } from "@/hooks/quranQueries";
import { useAppLocale } from "@/i18n/useAppLocale";
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
  const { appLanguage, t, textAlign, isRTL } = useAppLocale();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounced = useDebouncedValue(query, 350);
  const trimmed = debounced.trim();

  const { translationId } = useSettingsStore(
    useShallow((state) => ({
      translationId: state.translationId,
    }))
  );
  const chaptersQuery = useChaptersQuery({ language: appLanguage });

  const searchQuery = useSearchQuery({
    query: debounced,
    translationId: translationId ?? 85,
    page: 1,
    size: 20,
    language: appLanguage,
  });

  const results = useMemo<SearchResult[]>(() => searchQuery.data?.results ?? [], [searchQuery.data]);
  const quickJumps = useMemo(
    () => [
      { label: "Al-Fatihah", verseKey: "1:1" },
      { label: "Ayat al-Kursi", verseKey: "2:255" },
      { label: "Al-Kahf", verseKey: "18:1" },
      { label: "Ya-Sin", verseKey: "36:1" },
      { label: "Al-Mulk", verseKey: "67:1" },
    ],
    []
  );
  const surahMatches = useMemo(() => {
    if (!trimmed) return [];
    const list = chaptersQuery.data ?? [];
    const lower = trimmed.toLowerCase();
    return list
      .filter((c) => c.name_simple.toLowerCase().includes(lower) || c.name_arabic.includes(trimmed))
      .slice(0, 5);
  }, [chaptersQuery.data, trimmed]);

  function rememberSearch(value: string) {
    const next = value.trim();
    if (!next) return;
    setRecentSearches((current) => [next, ...current.filter((item) => item !== next)].slice(0, 5));
  }

  function openVerseKey(key: string) {
    const chapter = Number(key.split(":")[0]);
    router.push({ pathname: `/surah/${chapter}`, params: { verseKey: key } });
  }

  return (
    <Screen className="pt-6">
      <AppHeader
        title={t("search.title")}
        subtitle={t("search.subtitle")}
        showBack
        right={<NowPlayingButton />}
      />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t("search.placeholder")}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={{ textAlign, writingDirection: isRTL ? "rtl" : "ltr" }}
        onSubmitEditing={() => {
          rememberSearch(query);
          const key = parseVerseKey(query);
          if (!key) return;
          openVerseKey(key);
        }}
        className="rounded-2xl border border-border bg-surface px-4 py-3 font-ui text-base text-text"
      />

      {trimmed.length === 0 ? (
        <>
          <View className="mt-6 rounded-2xl border border-border bg-surface px-4 py-4">
            <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("search.tipsTitle")}</Text>
            <Text className="mt-2 font-ui text-muted" style={{ textAlign }}>{t("search.tipsBody")}</Text>
          </View>

          <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4">
            <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>Quick jumps</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {quickJumps.map((item) => (
                <Pressable
                  key={item.verseKey}
                  className="rounded-full bg-bg px-4 py-2 active:opacity-80"
                  onPress={() => openVerseKey(item.verseKey)}
                >
                  <Text className="font-uiMedium text-xs text-text">{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {recentSearches.length ? (
            <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4">
              <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>Recent searches</Text>
              <View className="mt-3 gap-2">
                {recentSearches.map((item) => (
                  <Pressable
                    key={item}
                    className="rounded-2xl bg-bg px-4 py-3 active:opacity-80"
                    onPress={() => setQuery(item)}
                  >
                    <Text className="font-uiMedium text-sm text-text">{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </>
      ) : (
        <>
          {surahMatches.length ? (
            <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4">
              <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("search.surahs")}</Text>
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
              <Text className="mt-3 font-ui text-muted" style={{ textAlign }}>{t("search.searching")}</Text>
            </View>
          ) : searchQuery.isError ? (
            <View className="mt-6 rounded-2xl border border-border bg-surface px-4 py-4">
              <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("search.failedTitle")}</Text>
              <Text className="mt-2 font-ui text-muted" style={{ textAlign }}>{t("search.failedBody")}</Text>
              <Pressable
                className="mt-4 self-start rounded-2xl bg-primary px-4 py-2"
                onPress={() => searchQuery.refetch()}
              >
                <Text className="font-uiSemibold text-primaryForeground">{t("common.retry")}</Text>
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
                  <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("search.noResultsTitle")}</Text>
                  <Text className="mt-2 font-ui text-muted" style={{ textAlign }}>
                    {t("search.noResultsBody")}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const chapter = Number(item.verse_key.split(":")[0]);
                return (
                  <Pressable
                    className="active:opacity-80"
                    onPress={() => {
                      rememberSearch(query);
                      router.push({ pathname: `/surah/${chapter}`, params: { verseKey: item.verse_key } });
                    }}
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
