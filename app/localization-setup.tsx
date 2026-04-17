import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { Screen } from "@/components/Screen";
import {
  type AppLanguage,
  type QuranContentLanguage,
  type QuranReadingMode,
} from "@/i18n/config";
import { APP_LANGUAGE_NATIVE_LABELS, QURAN_LANGUAGE_NATIVE_LABELS } from "@/i18n/languageMetadata";
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
  } = useSettingsStore(
    useShallow((state) => ({
      appLanguage: state.appLanguage,
      quranTranslationLanguage: state.quranTranslationLanguage,
      setAppLanguage: state.setAppLanguage,
      completeLocalizationSetup: state.completeLocalizationSetup,
      showTranslation: state.showTranslation,
      showTransliteration: state.showTransliteration,
    }))
  );
  const { t, textAlign, rowDirection } = useAppLocale();
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
        <Text className="font-uiSemibold text-3xl text-text" style={{ textAlign }}>
          {t("localizationSetup.title")}
        </Text>
        <Text className="mt-3 font-ui text-base text-muted" style={{ textAlign }}>
          {t("localizationSetup.subtitle")}
        </Text>

        <View className="mt-8 gap-2" style={{ flexDirection: rowDirection }}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              className={`h-2 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </View>

        {step === 0 ? (
          <View className="mt-8">
            <Text className="font-uiSemibold text-xl text-text" style={{ textAlign }}>
              {t("localizationSetup.stepLanguageTitle")}
            </Text>
            <Text className="mt-2 font-ui text-sm text-muted" style={{ textAlign }}>
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
                    <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>
                      {APP_LANGUAGE_NATIVE_LABELS[language]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View className="mt-8">
            <Text className="font-uiSemibold text-xl text-text" style={{ textAlign }}>
              {t("localizationSetup.stepModeTitle")}
            </Text>
            <Text className="mt-2 font-ui text-sm text-muted" style={{ textAlign }}>
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
                    <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View className="mt-8">
            <Text className="font-uiSemibold text-xl text-text" style={{ textAlign }}>
              {t("localizationSetup.stepTranslationTitle")}
            </Text>
            <Text className="mt-2 font-ui text-sm text-muted" style={{ textAlign }}>
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
                    <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>
                      {QURAN_LANGUAGE_NATIVE_LABELS[language]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      <View className="mt-8 gap-3" style={{ flexDirection: rowDirection }}>
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
