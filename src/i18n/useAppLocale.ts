import { useTranslation } from "react-i18next";
import { isRTLAppLanguage } from "@/i18n/config";
import { useSettingsStore } from "@/store/settingsStore";

export function useAppLocale() {
  const appLanguage = useSettingsStore((state) => state.appLanguage);
  const { t, i18n } = useTranslation();
  const isRTL = isRTLAppLanguage(appLanguage);

  return {
    appLanguage,
    isRTL,
    textAlign: isRTL ? ("right" as const) : ("left" as const),
    writingDirection: isRTL ? ("rtl" as const) : ("ltr" as const),
    rowDirection: isRTL ? ("row-reverse" as const) : ("row" as const),
    t,
    i18n,
  };
}
