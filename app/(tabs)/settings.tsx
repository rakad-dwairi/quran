import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { IconButton } from "@/components/IconButton";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
import { useRecitationsQuery, useTafsirsQuery, useTranslationsQuery } from "@/hooks/quranQueries";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";

export default function SettingsScreen() {
  const {
    translationId,
    recitationId,
    tafsirId,
    showTranslation,
    arabicFontSize,
    translationFontSize,
    setShowTranslation,
    bumpArabicFontSize,
    bumpTranslationFontSize,
  } = useSettingsStore();

  const translationsQuery = useTranslationsQuery({ language: "en" });
  const recitationsQuery = useRecitationsQuery({ language: "en" });
  const tafsirsQuery = useTafsirsQuery({ language: "en" });

  const translationName = useMemo(() => {
    const match = translationsQuery.data?.find((t) => t.id === translationId);
    return match ? match.name : `Translation #${translationId}`;
  }, [translationsQuery.data, translationId]);

  const reciterName = useMemo(() => {
    const match = recitationsQuery.data?.find((r) => r.id === recitationId);
    return match ? match.reciter_name : `Reciter #${recitationId}`;
  }, [recitationsQuery.data, recitationId]);

  const tafsirName = useMemo(() => {
    const match = tafsirsQuery.data?.find((t) => t.id === tafsirId);
    return match ? match.name : `Tafsir #${tafsirId}`;
  }, [tafsirsQuery.data, tafsirId]);

  return (
    <Screen className="pt-6">
      <AppHeader
        title="Settings"
        subtitle="Typography and preferences."
        showBack
        right={<NowPlayingButton />}
      />

      <View className="rounded-2xl border border-border bg-surface p-4">
        <Text className="font-uiSemibold text-base text-text">Reading</Text>

        <Pressable
          className="mt-4 flex-row items-center justify-between"
          onPress={() => router.push("/settings/translations")}
        >
          <View className="flex-1 pr-4">
            <Text className="font-uiMedium text-sm text-text">Translation</Text>
            <Text className="mt-1 font-ui text-sm text-muted" numberOfLines={1}>
              {translationName}
            </Text>
          </View>
          <IconButton
            name="chevron-right"
            accessibilityLabel="Choose translation"
            onPress={() => router.push("/settings/translations")}
            color={colors.muted}
          />
        </Pressable>

        <Pressable
          className="mt-2 flex-row items-center justify-between"
          onPress={() => router.push("/settings/recitations")}
        >
          <View className="flex-1 pr-4">
            <Text className="font-uiMedium text-sm text-text">Reciter</Text>
            <Text className="mt-1 font-ui text-sm text-muted" numberOfLines={1}>
              {reciterName}
            </Text>
          </View>
          <IconButton
            name="chevron-right"
            accessibilityLabel="Choose reciter"
            onPress={() => router.push("/settings/recitations")}
            color={colors.muted}
          />
        </Pressable>

        <Pressable
          className="mt-2 flex-row items-center justify-between"
          onPress={() => router.push("/settings/tafsir")}
        >
          <View className="flex-1 pr-4">
            <Text className="font-uiMedium text-sm text-text">Tafsir source</Text>
            <Text className="mt-1 font-ui text-sm text-muted" numberOfLines={1}>
              {tafsirName}
            </Text>
          </View>
          <IconButton
            name="chevron-right"
            accessibilityLabel="Choose tafsir"
            onPress={() => router.push("/settings/tafsir")}
            color={colors.muted}
          />
        </Pressable>

        <View className="mt-4 flex-row items-center justify-between">
          <View>
            <Text className="font-uiMedium text-sm text-text">Show translation</Text>
            <Text className="mt-1 font-ui text-sm text-muted">Display translation under Arabic text.</Text>
          </View>
          <Switch
            value={showTranslation}
            onValueChange={setShowTranslation}
            trackColor={{ false: colors.border, true: colors.primaryMuted }}
            thumbColor={showTranslation ? colors.primary : colors.bg}
          />
        </View>
      </View>

      <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <Text className="font-uiSemibold text-base text-text">Typography</Text>

        <View className="mt-4 flex-row items-center justify-between">
          <View>
            <Text className="font-uiMedium text-sm text-text">Arabic size</Text>
            <Text className="mt-1 font-ui text-sm text-muted">{arabicFontSize}px</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <IconButton
              name="minus"
              accessibilityLabel="Decrease Arabic font size"
              onPress={() => bumpArabicFontSize(-2)}
              color={colors.text}
              className="bg-bg"
            />
            <IconButton
              name="plus"
              accessibilityLabel="Increase Arabic font size"
              onPress={() => bumpArabicFontSize(2)}
              color={colors.text}
              className="bg-bg"
            />
          </View>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <View>
            <Text className="font-uiMedium text-sm text-text">Translation size</Text>
            <Text className="mt-1 font-ui text-sm text-muted">{translationFontSize}px</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <IconButton
              name="minus"
              accessibilityLabel="Decrease translation font size"
              onPress={() => bumpTranslationFontSize(-1)}
              color={colors.text}
              className="bg-bg"
            />
            <IconButton
              name="plus"
              accessibilityLabel="Increase translation font size"
              onPress={() => bumpTranslationFontSize(1)}
              color={colors.text}
              className="bg-bg"
            />
          </View>
        </View>
      </View>

      <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <Text className="font-uiSemibold text-base text-text">Offline</Text>
        <Pressable
          className="mt-4 flex-row items-center justify-between"
          onPress={() => router.push("/settings/downloads")}
        >
          <View className="flex-1 pr-4">
            <Text className="font-uiMedium text-sm text-text">Downloads</Text>
            <Text className="mt-1 font-ui text-sm text-muted">Manage downloaded text and audio.</Text>
          </View>
          <IconButton
            name="chevron-right"
            accessibilityLabel="Open downloads"
            onPress={() => router.push("/settings/downloads")}
            color={colors.muted}
          />
        </Pressable>
      </View>

      <View className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <Text className="font-uiSemibold text-base text-text">Cloud</Text>
        <Pressable
          className="mt-4 flex-row items-center justify-between"
          onPress={() => router.push("/settings/account")}
        >
          <View className="flex-1 pr-4">
            <Text className="font-uiMedium text-sm text-text">Cloud Sync</Text>
            <Text className="mt-1 font-ui text-sm text-muted">Sync bookmarks and favorites across devices.</Text>
          </View>
          <IconButton
            name="chevron-right"
            accessibilityLabel="Open cloud sync"
            onPress={() => router.push("/settings/account")}
            color={colors.muted}
          />
        </Pressable>
      </View>
    </Screen>
  );
}
