import type { SearchResult } from "@/services/quranComApi";
import { Text, View } from "react-native";
import { useAppLocale } from "@/i18n/useAppLocale";

export function SearchResultItem({ result }: { result: SearchResult }) {
  const { t, rowDirection, textAlign } = useAppLocale();

  return (
    <View className="rounded-3xl border border-border bg-surface px-5 py-5">
      <View className="items-center justify-between" style={{ flexDirection: rowDirection }}>
        <Text className="font-uiSemibold text-sm text-text">{result.verse_key}</Text>
        <Text className="font-ui text-xs text-muted">{t("common.openVerse")}</Text>
      </View>

      <Text
        className="mt-4 font-arabic text-text"
        style={{ writingDirection: "rtl", textAlign: "right", lineHeight: 40 }}
      >
        {result.textPlain}
      </Text>

      {result.translationPlain ? (
        <Text className="mt-3 font-serif text-sm leading-6 text-muted" style={{ textAlign }}>{result.translationPlain}</Text>
      ) : null}
    </View>
  );
}
