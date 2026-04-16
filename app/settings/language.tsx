import { Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { type AppLanguage } from "@/i18n/config";
import { useAppLocale } from "@/i18n/useAppLocale";
import { useSettingsStore } from "@/store/settingsStore";

const APP_LANGUAGES: AppLanguage[] = ["en", "ar", "es"];

export default function LanguageSettingsScreen() {
  const { appLanguage, regionCountry, calendarPreference, setAppLanguage, setCalendarPreference } =
    useSettingsStore(
      useShallow((state) => ({
        appLanguage: state.appLanguage,
        regionCountry: state.regionCountry,
        calendarPreference: state.calendarPreference,
        setAppLanguage: state.setAppLanguage,
        setCalendarPreference: state.setCalendarPreference,
      }))
    );
  const { t, isRTL } = useAppLocale();

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title={t("settings.languageRegion")} subtitle={t("settings.languageRegionSubtitle")} showBack />

      <View className="rounded-2xl border border-border bg-surface p-4">
        <Text className="font-uiSemibold text-base text-text">{t("settings.appLanguage")}</Text>
        <View className="mt-4 gap-2">
          {APP_LANGUAGES.map((language) => {
            const selected = language === appLanguage;
            const label =
              language === "ar" ? "العربية" : language === "es" ? "Español" : "English";
            return (
              <Pressable
                key={language}
                className={`rounded-2xl border px-4 py-3 ${
                  selected ? "border-primary bg-primaryMuted" : "border-border bg-bg"
                }`}
                onPress={() => setAppLanguage(language)}
              >
                <Text className="font-uiSemibold text-sm text-text">{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <Text className="font-uiSemibold text-base text-text">{t("settings.region")}</Text>
        <Text className="mt-2 font-ui text-sm text-muted" style={{ textAlign: isRTL ? "right" : "left" }}>
          {regionCountry || "-"}
        </Text>

        <Text className="mt-5 font-uiSemibold text-base text-text">{t("settings.calendar")}</Text>
        <View className="mt-3 flex-row rounded-2xl border border-border bg-bg p-1">
          {(["gregorian", "hijri"] as const).map((value) => {
            const selected = calendarPreference === value;
            return (
              <Pressable
                key={value}
                className={`flex-1 rounded-xl px-3 py-2 ${selected ? "bg-primary" : "bg-transparent"}`}
                onPress={() => setCalendarPreference(value)}
              >
                <Text
                  className={`text-center font-uiSemibold ${
                    selected ? "text-primaryForeground" : "text-text"
                  }`}
                >
                  {value === "gregorian"
                    ? t("settings.calendarGregorian")
                    : t("settings.calendarHijri")}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
