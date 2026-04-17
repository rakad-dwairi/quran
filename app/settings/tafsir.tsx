import { Stack, router } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { type TafsirLanguage } from "@/i18n/config";
import { TAFSIR_LANGUAGE_NATIVE_LABELS } from "@/i18n/languageMetadata";
import { useAppLocale } from "@/i18n/useAppLocale";
import { useSettingsStore } from "@/store/settingsStore";

const OPTIONS: TafsirLanguage[] = ["en", "ar"];

export default function TafsirSettingsScreen() {
  const { tafsirLanguage, setTafsirLanguage } = useSettingsStore(
    useShallow((state) => ({
      tafsirLanguage: state.tafsirLanguage,
      setTafsirLanguage: state.setTafsirLanguage,
    }))
  );
  const { t, textAlign } = useAppLocale();

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title={t("settings.tafsirLanguage")} subtitle={t("settings.tafsirLanguageSubtitle")} showBack />

      <FlatList
        className="mt-4"
        data={OPTIONS}
        keyExtractor={(item) => item}
        ItemSeparatorComponent={() => <View className="h-2" />}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const selected = item === tafsirLanguage;
          return (
            <Pressable
              className={`rounded-2xl border px-4 py-3 active:opacity-80 ${
                selected ? "border-primary bg-primaryMuted" : "border-border bg-surface"
              }`}
              onPress={() => {
                setTafsirLanguage(item);
                router.back();
              }}
            >
              <Text className="font-uiSemibold text-sm text-text" style={{ textAlign }}>
                {TAFSIR_LANGUAGE_NATIVE_LABELS[item]}
              </Text>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
