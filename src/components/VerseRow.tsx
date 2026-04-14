import type { Verse } from "@/services/quranComApi";
import { Text, View } from "react-native";
import { IconButton } from "@/components/IconButton";
import { useLibraryStore } from "@/store/libraryStore";
import { colors } from "@/theme/colors";
import { router } from "expo-router";

export function VerseRow({
  verse,
  showTranslation,
  arabicFontSize,
  translationFontSize,
  highlighted,
}: {
  verse: Verse;
  showTranslation: boolean;
  arabicFontSize: number;
  translationFontSize: number;
  highlighted?: boolean;
}) {
  const translation = verse.translations?.[0]?.textPlain;
  const verseKey = verse.verse_key;
  const bookmarked = useLibraryStore((s) => !!s.bookmarks[verseKey]);
  const favorited = useLibraryStore((s) => !!s.favorites[verseKey]);
  const toggleBookmark = useLibraryStore((s) => s.toggleBookmark);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const chapterId = Number(verseKey.split(":")[0]);

  return (
    <View
      className={`rounded-2xl border px-4 py-4 ${
        highlighted ? "border-primary bg-primaryMuted" : "border-border bg-surface"
      }`}
    >
      <Text className="font-arabic text-text" style={{ fontSize: arabicFontSize, lineHeight: arabicFontSize * 1.9, writingDirection: "rtl", textAlign: "right" }}>
        {verse.text_uthmani ?? ""}
      </Text>

      {showTranslation && translation ? (
        <Text
          className="mt-3 font-serif text-muted"
          style={{
            fontSize: translationFontSize,
            lineHeight: Math.round(translationFontSize * 1.6),
          }}
        >
          {translation}
        </Text>
      ) : null}

      <View className="mt-4 flex-row items-center justify-between">
        <Text className="font-ui text-xs text-muted">{verseKey}</Text>
        <View className="flex-row items-center">
          <IconButton
            name="book-open-page-variant"
            accessibilityLabel="Open tafsir"
            onPress={() => router.push({ pathname: "/tafsir", params: { verseId: String(verse.id), verseKey } })}
            color={colors.muted}
          />
          <IconButton
            name={bookmarked ? "bookmark" : "bookmark-outline"}
            accessibilityLabel={bookmarked ? "Remove bookmark" : "Add bookmark"}
            onPress={() =>
              toggleBookmark({
                verseKey,
                chapterId,
                verseNumber: verse.verse_number,
                arabicText: verse.text_uthmani ?? "",
                translationText: translation,
                createdAt: Date.now(),
              })
            }
            color={bookmarked ? colors.primary : colors.muted}
          />
          <IconButton
            name={favorited ? "heart" : "heart-outline"}
            accessibilityLabel={favorited ? "Remove favorite" : "Add favorite"}
            onPress={() =>
              toggleFavorite({
                verseKey,
                chapterId,
                verseNumber: verse.verse_number,
                arabicText: verse.text_uthmani ?? "",
                translationText: translation,
                createdAt: Date.now(),
              })
            }
            color={favorited ? "#DC2626" : colors.muted}
          />
        </View>
      </View>
    </View>
  );
}
