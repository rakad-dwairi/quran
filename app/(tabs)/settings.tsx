import { router } from "expo-router";
import { ScrollView, Switch, Text, View, Pressable } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { AppHeader } from "@/components/AppHeader";
import { IconButton } from "@/components/IconButton";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
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
  return (
    <Pressable className="mt-4 flex-row items-center justify-between" onPress={() => router.push(href)}>
      <View className="flex-1 pr-4">
        <Text className="font-uiMedium text-sm text-text">{title}</Text>
        <Text className="mt-1 font-ui text-sm text-muted" numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <IconButton
        name="chevron-right"
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
  const { t } = useAppLocale();

  const translationLanguageLabel =
    quranTranslationLanguage === "ar"
      ? "Arabic"
      : quranTranslationLanguage === "es"
      ? "Spanish"
      : "English";
  const tafsirLanguageLabel = tafsirLanguage === "ar" ? "Arabic" : "English";

  return (
    <Screen className="pt-6" padded={false}>
      <View className="px-6">
        <AppHeader title={t("settings.title")} subtitle={t("settings.subtitle")} showBack right={<NowPlayingButton />} />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="rounded-2xl border border-border bg-surface p-4">
          <Text className="font-uiSemibold text-base text-text">{t("settings.languageRegion")}</Text>
          <SettingsLink
            title={t("settings.appLanguage")}
            subtitle={t("settings.languageRegionSubtitle")}
            href="/settings/language"
          />
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <Text className="font-uiSemibold text-base text-text">{t("settings.quranDisplay")}</Text>

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

          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="font-uiMedium text-sm text-text">{t("settings.showTranslation")}</Text>
              <Text className="mt-1 font-ui text-sm text-muted">{t("settings.showTranslationSubtitle")}</Text>
            </View>
            <Switch
              value={showTranslation}
              onValueChange={setShowTranslation}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={showTranslation ? colors.primary : colors.bg}
            />
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="font-uiMedium text-sm text-text">{t("settings.showTransliteration")}</Text>
              <Text className="mt-1 font-ui text-sm text-muted">{t("settings.showTransliterationSubtitle")}</Text>
            </View>
            <Switch
              value={showTransliteration}
              onValueChange={setShowTransliteration}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={showTransliteration ? colors.primary : colors.bg}
            />
          </View>

          <View className="mt-4">
            <Text className="font-uiMedium text-sm text-text">{t("settings.verseLayout")}</Text>
            <Text className="mt-1 font-ui text-sm text-muted">{t("settings.verseLayoutSubtitle")}</Text>

            <View className="mt-3 flex-row rounded-2xl border border-border bg-bg p-1">
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
          <Text className="font-uiSemibold text-base text-text">{t("settings.reading")}</Text>
          <SettingsLink
            title={t("readingPlan.title")}
            subtitle={t("readingPlan.subtitle")}
            href="/settings/reading-plan"
          />

          <View className="mt-4 flex-row items-center justify-between">
            <View>
              <Text className="font-uiMedium text-sm text-text">{t("settings.arabicSize")}</Text>
              <Text className="mt-1 font-ui text-sm text-muted">{arabicFontSize}px</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <IconButton name="minus" accessibilityLabel={t("settings.arabicSize")} onPress={() => bumpArabicFontSize(-2)} color={colors.text} className="bg-bg" />
              <IconButton name="plus" accessibilityLabel={t("settings.arabicSize")} onPress={() => bumpArabicFontSize(2)} color={colors.text} className="bg-bg" />
            </View>
          </View>

          <View className="mt-3 flex-row items-center justify-between">
            <View>
              <Text className="font-uiMedium text-sm text-text">{t("settings.translationSize")}</Text>
              <Text className="mt-1 font-ui text-sm text-muted">{translationFontSize}px</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <IconButton name="minus" accessibilityLabel={t("settings.translationSize")} onPress={() => bumpTranslationFontSize(-1)} color={colors.text} className="bg-bg" />
              <IconButton name="plus" accessibilityLabel={t("settings.translationSize")} onPress={() => bumpTranslationFontSize(1)} color={colors.text} className="bg-bg" />
            </View>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <Text className="font-uiSemibold text-base text-text">{t("settings.offline")}</Text>
          <SettingsLink title={t("settings.downloads")} subtitle={t("settings.offlineSubtitle")} href="/settings/downloads" />
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <Text className="font-uiSemibold text-base text-text">{t("settings.notifications")}</Text>
          <SettingsLink
            title={t("settings.dailyVerseAndPrayerAlerts")}
            subtitle={t("settings.notificationsSubtitle")}
            href="/settings/notifications"
          />
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <Text className="font-uiSemibold text-base text-text">{t("settings.cloud")}</Text>
          <SettingsLink title={t("settings.cloudSync")} subtitle={t("settings.cloudSubtitle")} href="/settings/account" />
        </View>
      </ScrollView>
    </Screen>
  );
}
