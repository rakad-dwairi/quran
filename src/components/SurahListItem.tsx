import type { Chapter } from "@/services/quranComApi";
import { Text, View } from "react-native";

export function SurahListItem({ chapter }: { chapter: Chapter }) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-border bg-surface px-4 py-4">
      <View className="flex-1 pr-4">
        <Text className="font-uiSemibold text-base text-text">
          {chapter.id}. {chapter.name_simple}
        </Text>
        <Text className="mt-1 font-ui text-sm text-muted">
          {chapter.translated_name?.name ?? "Translation"}
          {" • "}
          {chapter.verses_count} verses
        </Text>
      </View>
      <Text className="font-arabicSemibold text-xl text-text">{chapter.name_arabic}</Text>
    </View>
  );
}

