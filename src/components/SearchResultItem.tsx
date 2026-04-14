import type { SearchResult } from "@/services/quranComApi";
import { Text, View } from "react-native";

export function SearchResultItem({ result }: { result: SearchResult }) {
  return (
    <View className="rounded-2xl border border-border bg-surface px-4 py-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-uiSemibold text-sm text-text">{result.verse_key}</Text>
        <Text className="font-ui text-xs text-muted">Tap to open</Text>
      </View>

      <Text
        className="mt-3 font-arabic text-text"
        style={{ writingDirection: "rtl", textAlign: "right", lineHeight: 40 }}
      >
        {result.textPlain}
      </Text>

      {result.translationPlain ? (
        <Text className="mt-3 font-serif text-sm text-muted">{result.translationPlain}</Text>
      ) : null}
    </View>
  );
}

