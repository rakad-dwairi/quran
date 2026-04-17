import { Stack, router } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { type QuranContentLanguage } from "@/i18n/config";
import { QURAN_LANGUAGE_NATIVE_LABELS } from "@/i18n/languageMetadata";
import { useAppLocale } from "@/i18n/useAppLocale";
import { useSettingsStore } from "@/store/settingsStore";

const OPTIONS: QuranContentLanguage[] = ["en", "ar", "es"];

export default function TranslationsScreen() {
  const { quranTranslationLanguage, setQuranTranslationLanguage } = useSettingsStore(
    useShallow((state) => ({
      quranTranslationLanguage: state.quranTranslationLanguage,
      setQuranTranslationLanguage: state.setQuranTranslationLanguage,
    }))
  );
  const { t, textAlign } = useAppLocale();

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
        keyExtractor={(item) => item}
        ItemSeparatorComponent={() => <View className="h-2" />}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const selected = item === quranTranslationLanguage;
          return (
            <Pressable
              className={`rounded-2xl border px-4 py-3 active:opacity-80 ${
                selected ? "border-primary bg-primaryMuted" : "border-border bg-surface"
              }`}
              onPress={() => {
                setQuranTranslationLanguage(item);
                router.back();
              }}
            >
              <Text className="font-uiSemibold text-sm text-text" style={{ textAlign }}>
                {QURAN_LANGUAGE_NATIVE_LABELS[item]}
              </Text>
              {item === "ar" ? (
                <Text className="mt-1 font-ui text-sm text-muted" style={{ textAlign }}>
                  {t("settings.translationArabicDatasetNote")}
                </Text>
              ) : null}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
