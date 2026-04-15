import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { NowPlayingButton } from "@/components/NowPlayingButton";
import { Screen } from "@/components/Screen";
import { SurahListItem } from "@/components/SurahListItem";
import { useChaptersQuery } from "@/hooks/quranQueries";

export default function QuranScreen() {
  const chaptersQuery = useChaptersQuery({ language: "en" });
  const data = useMemo(() => chaptersQuery.data ?? [], [chaptersQuery.data]);

  return (
    <Screen className="pt-6">
      <AppHeader
        title="Quran"
        subtitle="Browse Surahs and continue reading."
        right={<NowPlayingButton />}
      />

      {chaptersQuery.isLoading ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator />
          <Text className="mt-3 font-ui text-muted">Loading Surahs…</Text>
        </View>
      ) : chaptersQuery.isError ? (
        <View className="flex-1 items-center justify-center py-10">
          <Text className="font-uiSemibold text-base text-text">Couldn’t load Surahs</Text>
          <Text className="mt-2 text-center font-ui text-muted">
            Check your connection and try again.
          </Text>
          <Pressable
            className="mt-5 rounded-2xl bg-primary px-5 py-3"
            onPress={() => chaptersQuery.refetch()}
          >
            <Text className="font-uiSemibold text-white">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/surah/${item.id}`)} className="active:opacity-80">
              <SurahListItem chapter={item} />
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

