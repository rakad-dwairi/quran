import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { ActionButton } from "@/components/ActionButton";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { SurahListItem } from "@/components/SurahListItem";
import { useChaptersQuery } from "@/hooks/quranQueries";
import { useAppLocale } from "@/i18n/useAppLocale";
import { showInterstitialAdIfAvailable } from "@/services/interstitialAds";
import { useSettingsStore } from "@/store/settingsStore";

export default function QuranScreen() {
  const { appLanguage, t, textAlign } = useAppLocale();
  const chaptersQuery = useChaptersQuery({ language: appLanguage });
  const data = useMemo(() => chaptersQuery.data ?? [], [chaptersQuery.data]);
  const { lastReadChapterId, lastReadVerseKey } = useSettingsStore(
    useShallow((state) => ({
      lastReadChapterId: state.lastReadChapterId,
      lastReadVerseKey: state.lastReadVerseKey,
    }))
  );

  async function openChapter(chapterId: number) {
    await showInterstitialAdIfAvailable();
    router.push(`/surah/${chapterId}`);
  }

  return (
    <Screen className="pt-6">
      <AppHeader
        title={t("quran.title")}
        subtitle={t("quran.subtitle")}
        right={<NowPlayingButton />}
      />

      <SectionCard compact className="mb-4">
        <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("quran.continueReading")}</Text>
        {lastReadChapterId && lastReadVerseKey ? (
          <View className="mt-3 flex-row items-center justify-between gap-4">
            <View className="flex-1">
              <Text className="font-ui text-sm text-muted" style={{ textAlign }}>{t("quran.lastPlace")}</Text>
              <Text className="mt-1 font-uiMedium text-sm text-text" style={{ textAlign }}>
                {t("quran.surahReference", { chapterId: lastReadChapterId, verseKey: lastReadVerseKey })}
              </Text>
            </View>
            <ActionButton
              label={t("quran.continueAction")}
              className="px-5"
              onPress={() =>
                router.push({ pathname: `/surah/${lastReadChapterId}`, params: { verseKey: lastReadVerseKey } })
              }
            />
          </View>
        ) : (
          <Text className="mt-2 font-ui text-sm leading-6 text-muted" style={{ textAlign }}>
            {t("quran.continueEmpty")}
          </Text>
        )}
      </SectionCard>

      <Pressable className="mb-4 active:opacity-80" onPress={() => router.push("/search")}>
        <SectionCard compact>
          <Text className="font-ui text-sm text-muted" style={{ textAlign }}>{t("quran.searchHint")}</Text>
          <Text className="mt-1 font-uiMedium text-sm text-text" style={{ textAlign }}>{t("quran.openSearch")}</Text>
        </SectionCard>
      </Pressable>

      {chaptersQuery.isLoading ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator />
          <Text className="mt-3 font-ui text-muted" style={{ textAlign }}>{t("quran.loadingSurahs")}</Text>
        </View>
      ) : chaptersQuery.isError ? (
        <EmptyState
          icon="book-open-page-variant-outline"
          title={t("quran.loadSurahListTitle")}
          body={t("quran.loadSurahListBody")}
          actionLabel={t("common.retry")}
          onAction={() => chaptersQuery.refetch()}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <Pressable onPress={() => openChapter(item.id)} className="active:opacity-80">
              <SurahListItem chapter={item} />
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
