import { router } from "expo-router";
import { useMemo } from "react";
import { SectionList, Text, View } from "react-native";
import { IconButton } from "@/components/IconButton";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
import { AppHeader } from "@/components/AppHeader";
import { useChaptersQuery } from "@/hooks/quranQueries";
import { useLibraryStore, type LibraryVerse } from "@/store/libraryStore";
import { colors } from "@/theme/colors";

export default function BookmarksScreen() {
  const chaptersQuery = useChaptersQuery({ language: "en" });

  const bookmarksMap = useLibraryStore((s) => s.bookmarks);
  const favoritesMap = useLibraryStore((s) => s.favorites);
  const removeBookmark = useLibraryStore((s) => s.removeBookmark);
  const removeFavorite = useLibraryStore((s) => s.removeFavorite);

  const chaptersById = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of chaptersQuery.data ?? []) map.set(c.id, c.name_simple);
    return map;
  }, [chaptersQuery.data]);

  const bookmarks = useMemo(() => {
    return Object.values(bookmarksMap).sort((a, b) => b.createdAt - a.createdAt);
  }, [bookmarksMap]);

  const favorites = useMemo(() => {
    return Object.values(favoritesMap).sort((a, b) => b.createdAt - a.createdAt);
  }, [favoritesMap]);

  type Section = { title: string; kind: "bookmark" | "favorite"; data: LibraryVerse[] };
  const sections = useMemo<Section[]>(() => {
    const out: Section[] = [];
    if (bookmarks.length) out.push({ title: "Bookmarks", kind: "bookmark", data: bookmarks });
    if (favorites.length) out.push({ title: "Favorites", kind: "favorite", data: favorites });
    return out;
  }, [bookmarks, favorites]);

  return (
    <Screen className="pt-6">
      <AppHeader
        title="Library"
        subtitle="Bookmarks and favorites."
        showBack
        right={<NowPlayingButton />}
      />

      {sections.length === 0 ? (
        <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-6">
          <Text className="font-uiSemibold text-base text-text">Nothing saved yet</Text>
          <Text className="mt-2 font-ui text-muted">
            Open a Surah and use the bookmark or heart icons on any verse.
          </Text>
        </View>
      ) : (
        <SectionList
          className="mt-2"
          sections={sections}
          keyExtractor={(item) => item.verseKey}
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <View className="h-2" />}
          SectionSeparatorComponent={() => <View className="h-4" />}
          renderSectionHeader={({ section }) => (
            <View className="mt-2">
              <Text className="font-uiSemibold text-base text-text">{section.title}</Text>
            </View>
          )}
          renderItem={({ item, section }) => {
            const chapterName = chaptersById.get(item.chapterId) ?? `Surah ${item.chapterId}`;
            return (
              <View className="rounded-2xl border border-border bg-surface px-4 py-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="font-uiSemibold text-sm text-text">
                      {item.verseKey} • {chapterName}
                    </Text>
                    {item.translationText ? (
                      <Text className="mt-2 font-serif text-sm text-muted" numberOfLines={3}>
                        {item.translationText}
                      </Text>
                    ) : (
                      <Text className="mt-2 font-arabic text-text" numberOfLines={2} style={{ writingDirection: "rtl", textAlign: "right" }}>
                        {item.arabicText}
                      </Text>
                    )}
                  </View>

                  <View>
                    <IconButton
                      name="open-in-new"
                      accessibilityLabel="Open verse"
                      onPress={() =>
                        router.push({ pathname: `/surah/${item.chapterId}`, params: { verseKey: item.verseKey } })
                      }
                      color={colors.text}
                      className="bg-white"
                    />
                    <IconButton
                      name="trash-can-outline"
                      accessibilityLabel="Remove from library"
                      onPress={() => {
                        if (section.kind === "bookmark") removeBookmark(item.verseKey);
                        else removeFavorite(item.verseKey);
                      }}
                      color={colors.danger}
                      className="bg-white"
                    />
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </Screen>
  );
}
