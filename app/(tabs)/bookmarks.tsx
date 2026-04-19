import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SectionList, Text, TextInput, View } from "react-native";
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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "bookmark" | "favorite" | "note" | "memorized" | "collection">("all");

  const bookmarksMap = useLibraryStore((s) => s.bookmarks);
  const favoritesMap = useLibraryStore((s) => s.favorites);
  const notesMap = useLibraryStore((s) => s.notes);
  const memorizedMap = useLibraryStore((s) => s.memorized);
  const collectionsMap = useLibraryStore((s) => s.collections);
  const removeBookmark = useLibraryStore((s) => s.removeBookmark);
  const removeFavorite = useLibraryStore((s) => s.removeFavorite);
  const removeNote = useLibraryStore((s) => s.removeNote);
  const toggleMemorized = useLibraryStore((s) => s.toggleMemorized);
  const toggleVerseInCollection = useLibraryStore((s) => s.toggleVerseInCollection);
  const removeCollection = useLibraryStore((s) => s.removeCollection);

  const chaptersById = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of chaptersQuery.data ?? []) map.set(c.id, c.name_simple);
    return map;
  }, [chaptersQuery.data]);

  const bookmarks = useMemo(() => Object.values(bookmarksMap).sort((a, b) => b.createdAt - a.createdAt), [bookmarksMap]);
  const favorites = useMemo(() => Object.values(favoritesMap).sort((a, b) => b.createdAt - a.createdAt), [favoritesMap]);
  const notes = useMemo(
    () => Object.values(notesMap).sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)),
    [notesMap]
  );
  const memorized = useMemo(
    () => Object.values(memorizedMap).sort((a, b) => b.memorizedAt - a.memorizedAt),
    [memorizedMap]
  );
  const allVersesByKey = useMemo(() => {
    const out = new Map<string, LibraryVerse>();
    for (const item of [...bookmarks, ...favorites, ...notes, ...memorized]) out.set(item.verseKey, item);
    return out;
  }, [bookmarks, favorites, memorized, notes]);
  const collections = useMemo(
    () => Object.values(collectionsMap).sort((a, b) => b.updatedAt - a.updatedAt),
    [collectionsMap]
  );

  const matchesQuery = (item: LibraryVerse) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return true;
    const chapterName = chaptersById.get(item.chapterId) ?? `Surah ${item.chapterId}`;
    return [
      item.verseKey,
      chapterName,
      item.arabicText,
      item.translationText,
      item.note,
      ...(item.tags ?? []),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(trimmed));
  };

  type Section = { title: string; kind: "bookmark" | "favorite" | "note" | "memorized" | "collection"; collectionId?: string; data: LibraryVerse[] };
  const sections = useMemo<Section[]>(() => {
    const out: Section[] = [];
    if ((filter === "all" || filter === "bookmark") && bookmarks.length) {
      out.push({ title: "Bookmarks", kind: "bookmark", data: bookmarks.filter(matchesQuery) });
    }
    if ((filter === "all" || filter === "favorite") && favorites.length) {
      out.push({ title: "Saved verses", kind: "favorite", data: favorites.filter(matchesQuery) });
    }
    if ((filter === "all" || filter === "note") && notes.length) {
      out.push({ title: "Notes", kind: "note", data: notes.filter(matchesQuery) });
    }
    if ((filter === "all" || filter === "memorized") && memorized.length) {
      out.push({ title: "Memorized", kind: "memorized", data: memorized.filter(matchesQuery) });
    }
    if (filter === "all" || filter === "collection") {
      for (const collection of collections) {
        const data = collection.verseKeys
          .map((key) => allVersesByKey.get(key))
          .filter((item): item is LibraryVerse => !!item)
          .filter(matchesQuery);
        if (data.length) {
          out.push({ title: collection.name, kind: "collection", collectionId: collection.id, data });
        }
      }
    }
    return out.filter((section) => section.data.length > 0);
  }, [allVersesByKey, bookmarks, chaptersById, collections, favorites, filter, memorized, notes, query]);

  const hasAnySavedContent = bookmarks.length + favorites.length + notes.length + memorized.length + collections.length > 0;

  return (
    <Screen className="pt-6">
      <AppHeader title="Saved content" subtitle="Bookmarks, notes, tags, and quick return points." showBack right={<NowPlayingButton />} />

      {!hasAnySavedContent ? (
        <EmptyState
          icon="bookmark-multiple-outline"
          title="No saved content yet"
          body="Open a Surah and save, favorite, or write a note on any verse. Your saved items will appear here."
          actionLabel="Browse Quran"
          onAction={() => router.push("/quran")}
        />
      ) : (
        <>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search saved verses, notes, or tags"
            placeholderTextColor={colors.muted}
            className="mt-2 rounded-2xl border border-border bg-surface px-4 py-3 font-ui text-base text-text"
          />

          <View className="mt-3 flex-row flex-wrap gap-2">
            {[
              ["all", "All"],
              ["bookmark", "Bookmarks"],
              ["favorite", "Favorites"],
              ["note", "Notes"],
              ["memorized", "Memorized"],
              ["collection", "Collections"],
            ].map(([id, label]) => (
              <Pressable
                key={id}
                className={`rounded-full px-4 py-2 active:opacity-80 ${filter === id ? "bg-primary" : "bg-surface"}`}
                onPress={() => setFilter(id as typeof filter)}
              >
                <Text className={`font-uiMedium text-xs ${filter === id ? "text-primaryForeground" : "text-text"}`}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          <SectionList
          className="mt-4"
          sections={sections}
          keyExtractor={(item, index) => `${item.verseKey}-${index}`}
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <View className="h-3" />}
          SectionSeparatorComponent={() => <View className="h-5" />}
          ListEmptyComponent={
            <View className="mt-6 rounded-2xl border border-border bg-surface px-4 py-5">
              <Text className="font-uiSemibold text-base text-text">No matching saved content</Text>
              <Text className="mt-2 font-ui text-sm leading-6 text-muted">
                Try a Surah name, verse key, note text, or tag.
              </Text>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="font-uiSemibold text-base text-text">{section.title}</Text>
              {section.kind === "collection" && section.collectionId ? (
                <Pressable className="rounded-full bg-surface px-3 py-1" onPress={() => removeCollection(section.collectionId!)}>
                  <Text className="font-uiMedium text-xs text-danger">Remove collection</Text>
                </Pressable>
              ) : null}
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
                    {item.note ? (
                      <Text className="mt-3 font-ui text-sm leading-6 text-text" numberOfLines={4}>
                        {item.note}
                      </Text>
                    ) : null}
                    {item.tags?.length ? (
                      <View className="mt-3 flex-row flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <View key={tag} className="rounded-full bg-primaryMuted px-3 py-1">
                            <Text className="font-uiMedium text-xs text-primary">#{tag}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
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
                        else if (section.kind === "favorite") removeFavorite(item.verseKey);
                        else if (section.kind === "note") removeNote(item.verseKey);
                        else if (section.kind === "memorized") toggleMemorized(item);
                        else if (section.kind === "collection" && section.collectionId) toggleVerseInCollection(section.collectionId, item);
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
        </>
      )}
    </Screen>
  );
}
