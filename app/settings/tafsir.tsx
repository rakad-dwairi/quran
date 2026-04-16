import { Stack, router } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { type TafsirLanguage } from "@/i18n/config";
import { useAppLocale } from "@/i18n/useAppLocale";
import { useSettingsStore } from "@/store/settingsStore";

const OPTIONS: Array<{ value: TafsirLanguage; labels: Record<TafsirLanguage, string> }> = [
  { value: "en", labels: { en: "English", ar: "الإنجليزية" } },
  { value: "ar", labels: { en: "Arabic", ar: "العربية" } },
];

export default function TafsirSettingsScreen() {
  const { tafsirLanguage, setTafsirLanguage } = useSettingsStore();
  const { t, appLanguage } = useAppLocale();
  const languageKey = appLanguage === "ar" ? "ar" : "en";

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title={t("settings.tafsirLanguage")} subtitle={t("settings.tafsirLanguageSubtitle")} showBack />

      <FlatList
        className="mt-4"
        data={OPTIONS}
        keyExtractor={(item) => item.value}
        ItemSeparatorComponent={() => <View className="h-2" />}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const selected = item.value === tafsirLanguage;
          return (
            <Pressable
              className={`rounded-2xl border px-4 py-3 active:opacity-80 ${
                selected ? "border-primary bg-primaryMuted" : "border-border bg-surface"
              }`}
              onPress={() => {
                setTafsirLanguage(item.value);
                router.back();
              }}
            >
              <Text className="font-uiSemibold text-sm text-text">{item.labels[languageKey]}</Text>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
