import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@/components/IconButton";
import { useAppLocale } from "@/i18n/useAppLocale";
import type { Verse } from "@/services/quranComApi";
import { useLibraryStore } from "@/store/libraryStore";
import { colors } from "@/theme/colors";

export function VerseActionsSheet({
  open,
  verse,
  onClose,
  showTranslation,
  showTransliteration,
  arabicFontSize,
  translationFontSize,
}: {
  open: boolean;
  verse: Verse | null;
  onClose: () => void;
  showTranslation: boolean;
  showTransliteration: boolean;
  arabicFontSize: number;
  translationFontSize: number;
}) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useAppLocale();

  const verseKey = verse?.verse_key ?? "";
  const translation = verse?.translations?.[0]?.textPlain;
  const transliteration = verse?.transliterationText;
  const chapterId = verseKey ? Number(verseKey.split(":")[0]) : 0;

  const bookmarked = useLibraryStore((s) => (verseKey ? !!s.bookmarks[verseKey] : false));
  const favorited = useLibraryStore((s) => (verseKey ? !!s.favorites[verseKey] : false));
  const toggleBookmark = useLibraryStore((s) => s.toggleBookmark);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  if (!open || !verse) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <Pressable
          className="mt-auto rounded-t-3xl border border-border bg-bg px-6 pt-4"
          style={{ paddingBottom: Math.max(16, insets.bottom + 16) }}
          onPress={() => {}}
        >
          <View className="items-center">
            <View className="h-1 w-14 rounded-full bg-border" />
          </View>

          <View className="mt-4 flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="font-uiSemibold text-base text-text">{verseKey}</Text>
              <Text className="mt-1 font-ui text-sm text-muted">{t("surah.chooseVerseAction")}</Text>
            </View>
            <IconButton
              name="close"
              accessibilityLabel={t("common.close")}
              onPress={onClose}
              color={colors.text}
              className="bg-surface"
            />
          </View>

          <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4">
            <Text
              className="font-arabic text-text"
              style={{
                fontSize: Math.min(32, arabicFontSize),
                lineHeight: Math.round(Math.min(32, arabicFontSize) * 1.9),
                writingDirection: "rtl",
                textAlign: "right",
              }}
            >
              {verse.text_uthmani ?? ""}
            </Text>

            {showTransliteration && transliteration ? (
              <Text
                className="mt-3 font-ui text-muted"
                style={{
                  fontSize: Math.min(15, translationFontSize),
                  lineHeight: Math.round(Math.min(15, translationFontSize) * 1.5),
                  textAlign: isRTL ? "right" : "left",
                }}
              >
                {transliteration}
              </Text>
            ) : null}

            {showTranslation && translation ? (
              <Text
                className="mt-3 font-serif text-muted"
                style={{
                  fontSize: Math.min(16, translationFontSize),
                  lineHeight: Math.round(Math.min(16, translationFontSize) * 1.6),
                  textAlign: isRTL ? "right" : "left",
                }}
              >
                {translation}
              </Text>
            ) : null}
          </View>

          <View className="mt-4 flex-row gap-3">
            <Pressable
              className="flex-1 flex-row items-center justify-center rounded-2xl border border-border bg-bg px-4 py-4 active:opacity-80"
              onPress={() => {
                onClose();
                router.push({
                  pathname: "/tafsir",
                  params: { verseId: String(verse.id), verseKey },
                });
              }}
            >
              <MaterialCommunityIcons name="book-open-page-variant" size={18} color={colors.primary} />
              <Text className="ml-2 font-uiSemibold text-sm text-text">{t("surah.tafsir")}</Text>
            </Pressable>

            <Pressable
              className={`flex-1 flex-row items-center justify-center rounded-2xl border border-border px-4 py-4 active:opacity-80 ${
                bookmarked ? "bg-primaryMuted" : "bg-bg"
              }`}
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
            >
              <MaterialCommunityIcons
                name={bookmarked ? "bookmark" : "bookmark-outline"}
                size={18}
                color={bookmarked ? colors.primary : colors.muted}
              />
              <Text className="ml-2 font-uiSemibold text-sm text-text">{t("surah.bookmark")}</Text>
            </Pressable>

            <Pressable
              className={`flex-1 flex-row items-center justify-center rounded-2xl border border-border px-4 py-4 active:opacity-80 ${
                favorited ? "bg-primaryMuted" : "bg-bg"
              }`}
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
            >
              <MaterialCommunityIcons
                name={favorited ? "heart" : "heart-outline"}
                size={18}
                color={favorited ? colors.danger : colors.muted}
              />
              <Text className="ml-2 font-uiSemibold text-sm text-text">{t("surah.favorite")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
