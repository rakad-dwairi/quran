import { Stack, router } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { type QuranContentLanguage } from "@/i18n/config";
import { useAppLocale } from "@/i18n/useAppLocale";
import { useSettingsStore } from "@/store/settingsStore";

const OPTIONS: Array<{ value: QuranContentLanguage; labels: Record<QuranContentLanguage, string> }> = [
  { value: "en", labels: { en: "English", ar: "الإنجليزية", es: "Ingles" } },
  { value: "ar", labels: { en: "Arabic", ar: "العربية", es: "Arabe" } },
  { value: "es", labels: { en: "Spanish", ar: "الإسبانية", es: "Espanol" } },
];

export default function TranslationsScreen() {
  const { quranTranslationLanguage, setQuranTranslationLanguage } = useSettingsStore(
    useShallow((state) => ({
      quranTranslationLanguage: state.quranTranslationLanguage,
      setQuranTranslationLanguage: state.setQuranTranslationLanguage,
    }))
  );
  const { t, appLanguage } = useAppLocale();

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader
        title={t("settings.translationLanguage")}
        subtitle={t("settings.translationLanguageSubtitle")}
        showBack
      />

      <FlatList
        className="mt-4"
        data={OPTIONS}
        keyExtractor={(item) => item.value}
        ItemSeparatorComponent={() => <View className="h-2" />}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const selected = item.value === quranTranslationLanguage;
          return (
            <Pressable
              className={`rounded-2xl border px-4 py-3 active:opacity-80 ${
                selected ? "border-primary bg-primaryMuted" : "border-border bg-surface"
              }`}
              onPress={() => {
                setQuranTranslationLanguage(item.value);
                router.back();
              }}
            >
              <Text className="font-uiSemibold text-sm text-text">{item.labels[appLanguage]}</Text>
              {item.value === "ar" ? (
                <Text className="mt-1 font-ui text-sm text-muted">
                  Arabic uses the original Quran text instead of a separate translation dataset.
                </Text>
              ) : null}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
