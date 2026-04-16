import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import {
  type AppLanguage,
  type QuranContentLanguage,
  type QuranReadingMode,
} from "@/i18n/config";
import { useAppLocale } from "@/i18n/useAppLocale";
import { useSettingsStore } from "@/store/settingsStore";

const APP_LANGUAGE_OPTIONS: AppLanguage[] = ["en", "ar", "es"];
const TRANSLATION_LANGUAGE_OPTIONS: QuranContentLanguage[] = ["en", "ar", "es"];

export default function LocalizationSetupScreen() {
  const {
    appLanguage,
    quranTranslationLanguage,
    setAppLanguage,
    completeLocalizationSetup,
    showTranslation,
    showTransliteration,
  } = useSettingsStore();
  const { t, isRTL } = useAppLocale();
  const [step, setStep] = useState(0);

  const currentMode = useMemo<QuranReadingMode>(() => {
    if (!showTranslation) return "arabicOnly";
    return showTransliteration ? "translationTransliteration" : "translation";
  }, [showTranslation, showTransliteration]);
  const [readingMode, setReadingMode] = useState<QuranReadingMode>(currentMode);
  const [translationLanguage, setTranslationLanguage] =
    useState<QuranContentLanguage>(quranTranslationLanguage);

  const canContinue = step < 2;

  return (
    <Screen className="justify-between pt-10">
      <Stack.Screen options={{ headerShown: false }} />

      <View>
        <Text
          className="font-uiSemibold text-3xl text-text"
          style={{ textAlign: isRTL ? "right" : "left" }}
        >
          {t("localizationSetup.title")}
        </Text>
        <Text
          className="mt-3 font-ui text-base text-muted"
          style={{ textAlign: isRTL ? "right" : "left" }}
        >
          {t("localizationSetup.subtitle")}
        </Text>

        <View className="mt-8 flex-row gap-2">
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              className={`h-2 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </View>

        {step === 0 ? (
          <View className="mt-8">
            <Text
              className="font-uiSemibold text-xl text-text"
              style={{ textAlign: isRTL ? "right" : "left" }}
            >
              {t("localizationSetup.stepLanguageTitle")}
            </Text>
            <Text
              className="mt-2 font-ui text-sm text-muted"
              style={{ textAlign: isRTL ? "right" : "left" }}
            >
              {t("localizationSetup.stepLanguageBody")}
            </Text>

            <View className="mt-5 gap-3">
              {APP_LANGUAGE_OPTIONS.map((language) => {
                const selected = language === appLanguage;
                return (
                  <Pressable
                    key={language}
                    className={`rounded-2xl border px-4 py-4 ${
                      selected ? "border-primary bg-primaryMuted" : "border-border bg-surface"
                    }`}
                    onPress={() => setAppLanguage(language)}
                  >
                    <Text className="font-uiSemibold text-base text-text">
                      {language === "ar"
                        ? "العربية"
                        : language === "es"
                        ? "Español"
                        : "English"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View className="mt-8">
            <Text
              className="font-uiSemibold text-xl text-text"
              style={{ textAlign: isRTL ? "right" : "left" }}
            >
              {t("localizationSetup.stepModeTitle")}
            </Text>
            <Text
              className="mt-2 font-ui text-sm text-muted"
              style={{ textAlign: isRTL ? "right" : "left" }}
            >
              {t("localizationSetup.stepModeBody")}
            </Text>

            <View className="mt-5 gap-3">
              {(
                [
                  ["arabicOnly", t("localizationSetup.modeArabicOnly")],
                  ["translation", t("localizationSetup.modeArabicTranslation")],
                  [
                    "translationTransliteration",
                    t("localizationSetup.modeArabicTranslationTransliteration"),
                  ],
                ] as const
              ).map(([value, label]) => {
                const selected = value === readingMode;
                return (
                  <Pressable
                    key={value}
                    className={`rounded-2xl border px-4 py-4 ${
                      selected ? "border-primary bg-primaryMuted" : "border-border bg-surface"
                    }`}
                    onPress={() => setReadingMode(value)}
                  >
                    <Text className="font-uiSemibold text-base text-text">{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View className="mt-8">
            <Text
              className="font-uiSemibold text-xl text-text"
              style={{ textAlign: isRTL ? "right" : "left" }}
            >
              {t("localizationSetup.stepTranslationTitle")}
            </Text>
            <Text
              className="mt-2 font-ui text-sm text-muted"
              style={{ textAlign: isRTL ? "right" : "left" }}
            >
              {t("localizationSetup.stepTranslationBody")}
            </Text>

            <View className="mt-5 gap-3">
              {TRANSLATION_LANGUAGE_OPTIONS.map((language) => {
                const selected = language === translationLanguage;
                return (
                  <Pressable
                    key={language}
                    className={`rounded-2xl border px-4 py-4 ${
                      selected ? "border-primary bg-primaryMuted" : "border-border bg-surface"
                    }`}
                    onPress={() => setTranslationLanguage(language)}
                  >
                    <Text className="font-uiSemibold text-base text-text">
                      {language === "ar"
                        ? "العربية"
                        : language === "es"
                        ? "Español"
                        : "English"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      <View className="mt-8 flex-row gap-3">
        {step > 0 ? (
          <Pressable
            className="flex-1 rounded-2xl border border-border bg-surface px-4 py-4"
            onPress={() => setStep((value) => value - 1)}
          >
            <Text className="text-center font-uiSemibold text-text">{t("common.back")}</Text>
          </Pressable>
        ) : null}

        <Pressable
          className="flex-1 rounded-2xl bg-primary px-4 py-4"
          onPress={() => {
            if (canContinue) {
              setStep((value) => value + 1);
              return;
            }

            completeLocalizationSetup({
              appLanguage,
              readingMode,
              translationLanguage,
            });
            router.replace("/welcome");
          }}
        >
          <Text className="text-center font-uiSemibold text-primaryForeground">
            {canContinue ? t("common.continue") : t("localizationSetup.finish")}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
