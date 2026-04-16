import { router } from "expo-router";
import { useMemo } from "react";
import { SectionList, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { IconButton } from "@/components/IconButton";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
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

  const bookmarks = useMemo(() => Object.values(bookmarksMap).sort((a, b) => b.createdAt - a.createdAt), [bookmarksMap]);
  const favorites = useMemo(() => Object.values(favoritesMap).sort((a, b) => b.createdAt - a.createdAt), [favoritesMap]);

  type Section = { title: string; kind: "bookmark" | "favorite"; data: LibraryVerse[] };
  const sections = useMemo<Section[]>(() => {
    const out: Section[] = [];
    if (bookmarks.length) out.push({ title: "Bookmarks", kind: "bookmark", data: bookmarks });
    if (favorites.length) out.push({ title: "Saved verses", kind: "favorite", data: favorites });
    return out;
  }, [bookmarks, favorites]);

  return (
    <Screen className="pt-6">
      <AppHeader title="Saved content" subtitle="Bookmarks, saved verses, and quick return points." showBack right={<NowPlayingButton />} />

      {sections.length === 0 ? (
        <EmptyState
          icon="bookmark-multiple-outline"
          title="No saved content yet"
          body="Open a Surah and use the bookmark or heart icons on any verse. Your saved items will appear here."
          actionLabel="Browse Quran"
          onAction={() => router.push("/quran")}
        />
      ) : (
        <SectionList
          className="mt-2"
          sections={sections}
          keyExtractor={(item) => item.verseKey}
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <View className="h-3" />}
          SectionSeparatorComponent={() => <View className="h-5" />}
          renderSectionHeader={({ section }) => (
            <View className="mt-2">
              <Text className="font-uiSemibold text-base text-text">{section.title}</Text>
            </View>
          )}
          renderItem={({ item, section }) => {
            const chapterName = chaptersById.get(item.chapterId) ?? `Surah ${item.chapterId}`;
            return (
              <View className="rounded-3xl border border-border bg-surface px-5 py-5">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="font-uiSemibold text-sm text-text">
                      {item.verseKey} · {chapterName}
                    </Text>
                    {item.translationText ? (
                      <Text className="mt-2 font-serif text-sm leading-6 text-muted" numberOfLines={3}>
                        {item.translationText}
                      </Text>
                    ) : (
                      <Text
                        className="mt-2 font-arabic text-text"
                        numberOfLines={2}
                        style={{ writingDirection: "rtl", textAlign: "right" }}
                      >
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
                      className="bg-bg"
                    />
                    <IconButton
                      name="trash-can-outline"
                      accessibilityLabel="Remove from library"
                      onPress={() => {
                        if (section.kind === "bookmark") removeBookmark(item.verseKey);
                        else removeFavorite(item.verseKey);
                      }}
                      color={colors.danger}
                      className="bg-bg"
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
