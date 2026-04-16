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
import { showInterstitialAdIfAvailable } from "@/services/interstitialAds";
import { useSettingsStore } from "@/store/settingsStore";

export default function QuranScreen() {
  const chaptersQuery = useChaptersQuery({ language: "en" });
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
        title="Quran"
        subtitle="Browse Surahs, search quickly, and return to your last reading place."
        right={<NowPlayingButton />}
      />

      <SectionCard compact className="mb-4">
        <Text className="font-uiSemibold text-base text-text">Continue reading</Text>
        {lastReadChapterId && lastReadVerseKey ? (
          <View className="mt-3 flex-row items-center justify-between gap-4">
            <View className="flex-1">
              <Text className="font-ui text-sm text-muted">Last place</Text>
              <Text className="mt-1 font-uiMedium text-sm text-text">
                Surah {lastReadChapterId} · {lastReadVerseKey}
              </Text>
            </View>
            <ActionButton
              label="Continue"
              className="px-5"
              onPress={() =>
                router.push({ pathname: `/surah/${lastReadChapterId}`, params: { verseKey: lastReadVerseKey } })
              }
            />
          </View>
        ) : (
          <Text className="mt-2 font-ui text-sm leading-6 text-muted">
            Start any Surah and your progress will appear here for quick return later.
          </Text>
        )}
      </SectionCard>

      <Pressable className="mb-4 active:opacity-80" onPress={() => router.push("/search")}>
        <SectionCard compact>
          <Text className="font-ui text-sm text-muted">Search Surahs, ayah references, or meanings</Text>
          <Text className="mt-1 font-uiMedium text-sm text-text">Open search</Text>
        </SectionCard>
      </Pressable>

      {chaptersQuery.isLoading ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator />
          <Text className="mt-3 font-ui text-muted">Loading Surahs...</Text>
        </View>
      ) : chaptersQuery.isError ? (
        <EmptyState
          icon="book-open-page-variant-outline"
          title="We could not load the Surah list"
          body="Check your connection and try again. Once the list loads, you can search, continue reading, or jump into any Surah."
          actionLabel="Retry"
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
