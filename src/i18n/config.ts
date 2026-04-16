import * as Localization from "expo-localization";

export type AppLanguage = "en" | "ar" | "es";
export type QuranContentLanguage = "ar" | "en" | "es";
export type TafsirLanguage = "ar" | "en";
export type CalendarPreference = "gregorian" | "hijri";
export type QuranReadingMode = "arabicOnly" | "translation" | "translationTransliteration";

export const SUPPORTED_APP_LANGUAGES: AppLanguage[] = ["en", "ar", "es"];
export const SUPPORTED_QURAN_TRANSLATION_LANGUAGES: QuranContentLanguage[] = ["ar", "en", "es"];
export const SUPPORTED_TAFSIR_LANGUAGES: TafsirLanguage[] = ["ar", "en"];

export const QURAN_TRANSLATION_RESOURCE_BY_LANGUAGE: Record<QuranContentLanguage, number | null> = {
  ar: null,
  en: 85,
  es: 83,
};

export const TAFSIR_RESOURCE_BY_LANGUAGE: Record<TafsirLanguage, number> = {
  ar: 16,
  en: 169,
};

export function isRTLAppLanguage(language: AppLanguage) {
  return language === "ar";
}

export function detectDeviceAppLanguage(): AppLanguage {
  const locale = Localization.getLocales()[0];
  const code = (locale?.languageCode ?? locale?.languageTag?.split("-")[0] ?? "en").toLowerCase();
  if (SUPPORTED_APP_LANGUAGES.includes(code as AppLanguage)) {
    return code as AppLanguage;
  }
  return "en";
}

export function detectDeviceRegion() {
  return Localization.getLocales()[0]?.regionCode ?? "";
}

export function getTranslationIdForLanguage(language: QuranContentLanguage) {
  return QURAN_TRANSLATION_RESOURCE_BY_LANGUAGE[language];
}

export function getTafsirIdForLanguage(language: TafsirLanguage) {
  return TAFSIR_RESOURCE_BY_LANGUAGE[language];
}
