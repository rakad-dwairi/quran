import type { Chapter } from "@/services/quranComApi";
import { Text, View } from "react-native";
import { useAppLocale } from "@/i18n/useAppLocale";

export function SurahListItem({ chapter }: { chapter: Chapter }) {
  const { t, textAlign, rowDirection } = useAppLocale();

  return (
    <View className="items-center justify-between rounded-3xl border border-border bg-surface px-5 py-5" style={{ flexDirection: rowDirection }}>
      <View className="flex-1" style={{ paddingEnd: 16 }}>
        <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>
          {chapter.id}. {chapter.name_simple}
        </Text>
        <Text className="mt-1 font-ui text-sm leading-6 text-muted" style={{ textAlign }}>
          {chapter.translated_name?.name ?? t("quran.translationFallback")} ? {t("quran.verseCount", { count: chapter.verses_count })}
        </Text>
        <Text className="mt-1 font-ui text-xs text-muted" style={{ textAlign }}>
          {chapter.revelation_place
            ? t("quran.revelationPlace", { place: chapter.revelation_place })
            : t("quran.chapterLabel")}
        </Text>
      </View>
      <Text className="font-arabicSemibold text-xl text-text">{chapter.name_arabic}</Text>
    </View>
  );
}
