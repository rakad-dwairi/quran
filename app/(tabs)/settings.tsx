import { router } from "expo-router";
import { ScrollView, Switch, Text, View, Pressable } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { AppHeader } from "@/components/AppHeader";
import { IconButton } from "@/components/IconButton";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
import { QURAN_LANGUAGE_NATIVE_LABELS, TAFSIR_LANGUAGE_NATIVE_LABELS } from "@/i18n/languageMetadata";
import { useAppLocale } from "@/i18n/useAppLocale";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";

function SettingsLink({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  const { isRTL, textAlign, rowDirection } = useAppLocale();

  return (
    <Pressable className="mt-4 items-center justify-between" style={{ flexDirection: rowDirection }} onPress={() => router.push(href)}>
      <View className="flex-1" style={{ paddingEnd: 16 }}>
        <Text className="font-uiMedium text-sm text-text" style={{ textAlign }}>{title}</Text>
        <Text className="mt-1 font-ui text-sm text-muted" style={{ textAlign }} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <IconButton
        name={isRTL ? "chevron-left" : "chevron-right"}
        accessibilityLabel={title}
        onPress={() => router.push(href)}
        color={colors.muted}
      />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const {
    quranTranslationLanguage,
    tafsirLanguage,
    showTranslation,
    showTransliteration,
    arabicFontSize,
    translationFontSize,
    verseLayout,
    setShowTranslation,
    setShowTransliteration,
    bumpArabicFontSize,
    bumpTranslationFontSize,
    setVerseLayout,
  } = useSettingsStore(
    useShallow((state) => ({
      quranTranslationLanguage: state.quranTranslationLanguage,
      tafsirLanguage: state.tafsirLanguage,
      showTranslation: state.showTranslation,
      showTransliteration: state.showTransliteration,
      arabicFontSize: state.arabicFontSize,
      translationFontSize: state.translationFontSize,
      verseLayout: state.verseLayout,
      setShowTranslation: state.setShowTranslation,
      setShowTransliteration: state.setShowTransliteration,
      bumpArabicFontSize: state.bumpArabicFontSize,
      bumpTranslationFontSize: state.bumpTranslationFontSize,
      setVerseLayout: state.setVerseLayout,
    }))
  );
  const { t, textAlign, rowDirection } = useAppLocale();

  const translationLanguageLabel = QURAN_LANGUAGE_NATIVE_LABELS[quranTranslationLanguage];
  const tafsirLanguageLabel = TAFSIR_LANGUAGE_NATIVE_LABELS[tafsirLanguage];

  return (
    <Screen className="pt-6" padded={false}>
      <View className="px-6">
        <AppHeader title={t("settings.title")} subtitle={t("settings.subtitle")} showBack right={<NowPlayingButton />} />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="rounded-2xl border border-border bg-surface p-4">
          <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("settings.languageRegion")}</Text>
          <SettingsLink
            title={t("settings.appLanguage")}
            subtitle={t("settings.languageRegionSubtitle")}
            href="/settings/language"
          />
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("settings.quranDisplay")}</Text>

          <SettingsLink
            title={t("settings.translationLanguage")}
            subtitle={translationLanguageLabel}
            href="/settings/translations"
          />

          <SettingsLink
            title={t("settings.tafsirLanguage")}
            subtitle={tafsirLanguageLabel}
            href="/settings/tafsir"
          />

          <View className="mt-4 items-center justify-between" style={{ flexDirection: rowDirection }}>
            <View className="flex-1" style={{ paddingEnd: 16 }}>
              <Text className="font-uiMedium text-sm text-text" style={{ textAlign }}>{t("settings.showTranslation")}</Text>
              <Text className="mt-1 font-ui text-sm text-muted" style={{ textAlign }}>{t("settings.showTranslationSubtitle")}</Text>
            </View>
            <Switch
              value={showTranslation}
              onValueChange={setShowTranslation}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={showTranslation ? colors.primary : colors.bg}
            />
          </View>

          <View className="mt-4 items-center justify-between" style={{ flexDirection: rowDirection }}>
            <View className="flex-1" style={{ paddingEnd: 16 }}>
              <Text className="font-uiMedium text-sm text-text" style={{ textAlign }}>{t("settings.showTransliteration")}</Text>
              <Text className="mt-1 font-ui text-sm text-muted" style={{ textAlign }}>{t("settings.showTransliterationSubtitle")}</Text>
            </View>
            <Switch
              value={showTransliteration}
              onValueChange={setShowTransliteration}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={showTransliteration ? colors.primary : colors.bg}
            />
          </View>

          <View className="mt-4">
            <Text className="font-uiMedium text-sm text-text" style={{ textAlign }}>{t("settings.verseLayout")}</Text>
            <Text className="mt-1 font-ui text-sm text-muted" style={{ textAlign }}>{t("settings.verseLayoutSubtitle")}</Text>

            <View className="mt-3 rounded-2xl border border-border bg-bg p-1" style={{ flexDirection: rowDirection }}>
              <Pressable
                className={`flex-1 rounded-xl px-3 py-2 ${verseLayout === "cards" ? "bg-primary" : "bg-transparent"}`}
                onPress={() => setVerseLayout("cards")}
              >
                <Text className={`text-center font-uiSemibold ${verseLayout === "cards" ? "text-primaryForeground" : "text-text"}`}>
                  {t("settings.cards")}
                </Text>
              </Pressable>
              <Pressable
                className={`flex-1 rounded-xl px-3 py-2 ${verseLayout === "mushaf" ? "bg-primary" : "bg-transparent"}`}
                onPress={() => setVerseLayout("mushaf")}
              >
                <Text className={`text-center font-uiSemibold ${verseLayout === "mushaf" ? "text-primaryForeground" : "text-text"}`}>
                  {t("settings.mushaf")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("settings.reading")}</Text>
          <SettingsLink
            title={t("readingPlan.title")}
            subtitle={t("readingPlan.subtitle")}
            href="/settings/reading-plan"
          />

          <View className="mt-4 items-center justify-between" style={{ flexDirection: rowDirection }}>
            <View>
              <Text className="font-uiMedium text-sm text-text" style={{ textAlign }}>{t("settings.arabicSize")}</Text>
              <Text className="mt-1 font-ui text-sm text-muted" style={{ textAlign }}>{arabicFontSize}px</Text>
            </View>
            <View className="items-center gap-2" style={{ flexDirection: rowDirection }}>
              <IconButton name="minus" accessibilityLabel={t("settings.arabicSize")} onPress={() => bumpArabicFontSize(-2)} color={colors.text} className="bg-bg" />
              <IconButton name="plus" accessibilityLabel={t("settings.arabicSize")} onPress={() => bumpArabicFontSize(2)} color={colors.text} className="bg-bg" />
            </View>
          </View>

          <View className="mt-3 items-center justify-between" style={{ flexDirection: rowDirection }}>
            <View>
              <Text className="font-uiMedium text-sm text-text" style={{ textAlign }}>{t("settings.translationSize")}</Text>
              <Text className="mt-1 font-ui text-sm text-muted" style={{ textAlign }}>{translationFontSize}px</Text>
            </View>
            <View className="items-center gap-2" style={{ flexDirection: rowDirection }}>
              <IconButton name="minus" accessibilityLabel={t("settings.translationSize")} onPress={() => bumpTranslationFontSize(-1)} color={colors.text} className="bg-bg" />
              <IconButton name="plus" accessibilityLabel={t("settings.translationSize")} onPress={() => bumpTranslationFontSize(1)} color={colors.text} className="bg-bg" />
            </View>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("settings.offline")}</Text>
          <SettingsLink title={t("settings.downloads")} subtitle={t("settings.offlineSubtitle")} href="/settings/downloads" />
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("settings.notifications")}</Text>
          <SettingsLink
            title={t("settings.dailyVerseAndPrayerAlerts")}
            subtitle={t("settings.notificationsSubtitle")}
            href="/settings/notifications"
          />
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("settings.cloud")}</Text>
          <SettingsLink title={t("settings.cloudSync")} subtitle={t("settings.cloudSubtitle")} href="/settings/account" />
        </View>
      </ScrollView>
    </Screen>
  );
}
