import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Verse } from "@/services/quranComApi";
import { Pressable, Text, View } from "react-native";
import { useLibraryStore } from "@/store/libraryStore";
import { colors } from "@/theme/colors";

export function VersePageRow({
  verse,
  showTranslation,
  arabicFontSize,
  translationFontSize,
  selected,
  onPress,
}: {
  verse: Verse;
  showTranslation: boolean;
  arabicFontSize: number;
  translationFontSize: number;
  selected?: boolean;
  onPress: () => void;
}) {
  const translation = verse.translations?.[0]?.textPlain;
  const verseKey = verse.verse_key;

  const bookmarked = useLibraryStore((s) => !!s.bookmarks[verseKey]);
  const favorited = useLibraryStore((s) => !!s.favorites[verseKey]);

  return (
    <Pressable
      className={`px-5 py-4 active:opacity-80 ${selected ? "bg-primaryMuted" : "bg-transparent"}`}
      onPress={onPress}
    >
      <Text
        className="font-arabic text-text"
        style={{
          fontSize: arabicFontSize,
          lineHeight: arabicFontSize * 1.85,
          writingDirection: "rtl",
          textAlign: "right",
        }}
      >
        {verse.text_uthmani ?? ""}
      </Text>

      {showTranslation && translation ? (
        <Text
          className="mt-2 font-serif text-muted"
          style={{
            fontSize: translationFontSize,
            lineHeight: Math.round(translationFontSize * 1.6),
          }}
        >
          {translation}
        </Text>
      ) : null}

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="font-ui text-xs text-muted">{verseKey}</Text>
        <View className="flex-row items-center gap-2">
          {bookmarked ? (
            <MaterialCommunityIcons name="bookmark" size={16} color={colors.primary} />
          ) : null}
          {favorited ? (
            <MaterialCommunityIcons name="heart" size={16} color={colors.danger} />
          ) : null}
          <MaterialCommunityIcons name="dots-horizontal" size={18} color={colors.muted} />
        </View>
      </View>
    </Pressable>
  );
}

