import { useTranslation } from "react-i18next";
import { isRTLAppLanguage } from "@/i18n/config";
import { useSettingsStore } from "@/store/settingsStore";

export function useAppLocale() {
  const appLanguage = useSettingsStore((state) => state.appLanguage);
  const { t, i18n } = useTranslation();

  return {
    appLanguage,
    isRTL: isRTLAppLanguage(appLanguage),
    t,
    i18n,
  };
}
