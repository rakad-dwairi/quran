import type { Verse } from "@/services/quranComApi";
import { formatAyahMarker } from "@/utils/arabicNumbers";
import { Text, View } from "react-native";
import { colors } from "@/theme/colors";

export function MushafPage({
  pageNumber,
  verses,
  arabicFontSize,
  highlightedVerseKey,
  onPressVerse,
}: {
  pageNumber: number | null;
  verses: Verse[];
  arabicFontSize: number;
  highlightedVerseKey?: string;
  onPressVerse: (verse: Verse) => void;
}) {
  return (
    <View className="rounded-3xl border border-border bg-bg px-5 pt-6 pb-5">
      <View className="flex-row items-center justify-between">
        <View className="h-px flex-1 bg-border" />
        <Text className="mx-3 font-uiSemibold text-xs text-muted">{pageNumber ? `Page ${pageNumber}` : "Page"}</Text>
        <View className="h-px flex-1 bg-border" />
      </View>

      <View className="mt-5">
        <Text
          className="font-arabic text-text"
          style={{
            fontSize: arabicFontSize,
            lineHeight: Math.round(arabicFontSize * 1.95),
            writingDirection: "rtl",
            textAlign: "justify",
          }}
        >
          {verses.map((v) => {
            const isHighlighted = v.verse_key === highlightedVerseKey;
            return (
              <Text
                key={String(v.id)}
                onPress={() => onPressVerse(v)}
                suppressHighlighting
                style={isHighlighted ? { backgroundColor: colors.primaryMuted } : undefined}
              >
                {v.text_uthmani ?? ""}
                {" "}
                <Text style={{ color: colors.accent, fontFamily: "NotoNaskhArabic_600SemiBold" }}>
                  {formatAyahMarker(v.verse_number)}
                </Text>
                {" "}
              </Text>
            );
          })}
        </Text>
      </View>

      <View className="mt-5 flex-row items-center justify-between">
        <View className="h-px w-12 bg-border" />
        <View className="rounded-full bg-surface px-4 py-2">
          <Text className="font-uiSemibold text-xs text-muted">Tap a verse for actions</Text>
        </View>
        <View className="h-px w-12 bg-border" />
      </View>
    </View>
  );
}
