import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@/components/IconButton";
import { useAppLocale } from "@/i18n/useAppLocale";
import type { Verse } from "@/services/quranComApi";
import { useAudioStore } from "@/store/audioStore";
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
  verses,
  chapterTitle,
}: {
  open: boolean;
  verse: Verse | null;
  onClose: () => void;
  showTranslation: boolean;
  showTransliteration: boolean;
  arabicFontSize: number;
  translationFontSize: number;
  verses?: Verse[] | null;
  chapterTitle?: string;
}) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useAppLocale();
  const playVerseQueue = useAudioStore((s) => s.playVerseQueue);

  const verseKey = verse?.verse_key ?? "";
  const translation = verse?.translations?.[0]?.textPlain;
  const transliteration = verse?.transliterationText;
  const chapterId = verseKey ? Number(verseKey.split(":")[0]) : 0;

  const bookmarked = useLibraryStore((s) => (verseKey ? !!s.bookmarks[verseKey] : false));
  const favorited = useLibraryStore((s) => (verseKey ? !!s.favorites[verseKey] : false));
  const savedNote = useLibraryStore((s) => (verseKey ? s.notes[verseKey] : undefined));
  const toggleBookmark = useLibraryStore((s) => s.toggleBookmark);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const saveNote = useLibraryStore((s) => s.saveNote);
  const removeNote = useLibraryStore((s) => s.removeNote);
  const [noteDraft, setNoteDraft] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [noteStatus, setNoteStatus] = useState<string | null>(null);

  useEffect(() => {
    setNoteDraft(savedNote?.note ?? "");
    setTagDraft(savedNote?.tags?.join(", ") ?? "");
  }, [savedNote?.note, savedNote?.tags, verseKey]);

  useEffect(() => {
    setNoteStatus(null);
  }, [verseKey]);

  const libraryVerse = useMemo(
    () =>
      verse
        ? {
            verseKey,
            chapterId,
            verseNumber: verse.verse_number,
            arabicText: verse.text_uthmani ?? "",
            translationText: translation,
            createdAt: savedNote?.createdAt ?? Date.now(),
          }
        : null,
    [chapterId, savedNote?.createdAt, translation, verse, verseKey]
  );

  const shareMessage = useMemo(() => {
    const parts = [verse?.text_uthmani, translation, verseKey ? `(${verseKey})` : ""].filter(Boolean);
    return parts.join("\n\n");
  }, [translation, verse?.text_uthmani, verseKey]);

  if (!open || !verse) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <Pressable className="flex-1 bg-black/40" onPress={onClose}>
          <Pressable
            className="mt-auto rounded-t-3xl border border-border bg-bg px-6 pt-4"
            style={{ maxHeight: "92%" }}
            onPress={() => {}}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Math.max(16, insets.bottom + 16) }}
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

          <View className="mt-4 flex-row flex-wrap gap-3">
            <Pressable
              className="min-w-[30%] flex-1 flex-row items-center justify-center rounded-2xl border border-border bg-bg px-4 py-4 active:opacity-80"
              onPress={async () => {
                try {
                  await Share.share({ message: shareMessage });
                } catch (e) {
                  Alert.alert("Share failed", e instanceof Error ? e.message : "Please try again.");
                }
              }}
            >
              <MaterialCommunityIcons name="share-variant" size={18} color={colors.primary} />
              <Text className="ml-2 font-uiSemibold text-sm text-text">Share</Text>
            </Pressable>

            <Pressable
              className="min-w-[30%] flex-1 flex-row items-center justify-center rounded-2xl border border-border bg-bg px-4 py-4 active:opacity-80"
              onPress={async () => {
                if (!verses?.length || !libraryVerse) return;
                onClose();
                await playVerseQueue({
                  chapterId,
                  title: chapterTitle ?? `Surah ${chapterId}`,
                  verses,
                  startVerseKey: verseKey,
                });
                router.push("/player");
              }}
              disabled={!verses?.length}
            >
              <MaterialCommunityIcons name="play-circle-outline" size={18} color={colors.primary} />
              <Text className="ml-2 font-uiSemibold text-sm text-text">Play</Text>
            </Pressable>

            <Pressable
              className="min-w-[30%] flex-1 flex-row items-center justify-center rounded-2xl border border-border bg-bg px-4 py-4 active:opacity-80"
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
              className={`min-w-[30%] flex-1 flex-row items-center justify-center rounded-2xl border border-border px-4 py-4 active:opacity-80 ${
                bookmarked ? "bg-primaryMuted" : "bg-bg"
              }`}
              onPress={() => libraryVerse && toggleBookmark({ ...libraryVerse, createdAt: Date.now() })}
            >
              <MaterialCommunityIcons
                name={bookmarked ? "bookmark" : "bookmark-outline"}
                size={18}
                color={bookmarked ? colors.primary : colors.muted}
              />
              <Text className="ml-2 font-uiSemibold text-sm text-text">{t("surah.bookmark")}</Text>
            </Pressable>

            <Pressable
              className={`min-w-[30%] flex-1 flex-row items-center justify-center rounded-2xl border border-border px-4 py-4 active:opacity-80 ${
                favorited ? "bg-primaryMuted" : "bg-bg"
              }`}
              onPress={() => libraryVerse && toggleFavorite({ ...libraryVerse, createdAt: Date.now() })}
            >
              <MaterialCommunityIcons
                name={favorited ? "heart" : "heart-outline"}
                size={18}
                color={favorited ? colors.danger : colors.muted}
              />
              <Text className="ml-2 font-uiSemibold text-sm text-text">{t("surah.favorite")}</Text>
            </Pressable>
          </View>

          <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4">
            <Text className="font-uiSemibold text-sm text-text">Personal note</Text>
            {noteStatus ? <Text className="mt-2 font-uiMedium text-xs text-primary">{noteStatus}</Text> : null}
            <TextInput
              value={noteDraft}
              onChangeText={setNoteDraft}
              multiline
              placeholder="Write a reflection, question, or reminder..."
              placeholderTextColor={colors.muted}
              className="mt-3 min-h-20 rounded-2xl border border-border bg-bg px-4 py-3 font-ui text-sm text-text"
              style={{ textAlignVertical: "top", textAlign: isRTL ? "right" : "left" }}
            />
            <TextInput
              value={tagDraft}
              onChangeText={setTagDraft}
              placeholder="Tags, separated by commas"
              placeholderTextColor={colors.muted}
              className="mt-3 rounded-2xl border border-border bg-bg px-4 py-3 font-ui text-sm text-text"
              style={{ textAlign: isRTL ? "right" : "left" }}
            />
            <View className="mt-3 flex-row gap-3">
              <Pressable
                className="flex-1 rounded-2xl bg-primary px-4 py-3 active:opacity-80"
                onPress={() => {
                  if (!libraryVerse) return;
                  Keyboard.dismiss();
                  if (!noteDraft.trim()) {
                    removeNote(verseKey);
                    setTagDraft("");
                    setNoteStatus("Note removed.");
                    return;
                  }
                  saveNote(
                    { ...libraryVerse, createdAt: savedNote?.createdAt ?? Date.now() },
                    noteDraft,
                    tagDraft.split(",")
                  );
                  setNoteStatus("Note saved. Find it in Saved content > Notes.");
                }}
              >
                <Text className="text-center font-uiSemibold text-sm text-primaryForeground">Save note</Text>
              </Pressable>
              {savedNote ? (
                <Pressable
                  className="rounded-2xl border border-border bg-bg px-4 py-3 active:opacity-80"
                  onPress={() => {
                    Keyboard.dismiss();
                    removeNote(verseKey);
                    setNoteDraft("");
                    setTagDraft("");
                    setNoteStatus("Note removed.");
                  }}
                >
                  <Text className="text-center font-uiSemibold text-sm text-danger">Remove</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
