import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "../../locales/ar.json";
import en from "../../locales/en.json";
import es from "../../locales/es.json";
import { detectDeviceAppLanguage, type AppLanguage } from "@/i18n/config";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  es: { translation: es },
} as const;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: detectDeviceAppLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: "v4",
    returnNull: false,
  });
}

export function tForLanguage(language: AppLanguage, key: string, options?: Record<string, unknown>) {
  return i18n.getFixedT(language)(key, options);
}

export default i18n;
