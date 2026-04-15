import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { useTafsirsQuery } from "@/hooks/quranQueries";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";

export default function TafsirSettingsScreen() {
  const { tafsirId, setTafsirId } = useSettingsStore();
  const tafsirsQuery = useTafsirsQuery({ language: "en" });
  const [filter, setFilter] = useState("");

  const data = useMemo(() => {
    const list = tafsirsQuery.data ?? [];
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? list.filter((t) => `${t.name} ${t.language_name ?? ""}`.toLowerCase().includes(q))
      : list;
    // Prefer English at top if available
    return filtered.sort((a, b) => {
      const aIsEn = a.language_name?.toLowerCase() === "english";
      const bIsEn = b.language_name?.toLowerCase() === "english";
      if (aIsEn && !bIsEn) return -1;
      if (!aIsEn && bIsEn) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [tafsirsQuery.data, filter]);

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Tafsir Source" subtitle="Choose a tafsir for the Tafsir screen." showBack />

      <TextInput
        value={filter}
        onChangeText={setFilter}
        placeholder="Filter tafsir sources…"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        className="rounded-2xl border border-border bg-surface px-4 py-3 font-ui text-base text-text"
      />

      {tafsirsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator />
          <Text className="mt-3 font-ui text-muted">Loading sources…</Text>
        </View>
      ) : tafsirsQuery.isError ? (
        <View className="mt-6 rounded-2xl border border-border bg-surface px-4 py-4">
          <Text className="font-uiSemibold text-base text-text">Couldn’t load sources</Text>
          <Text className="mt-2 font-ui text-muted">Check your connection and try again.</Text>
          <Pressable
            className="mt-4 self-start rounded-2xl bg-primary px-4 py-2"
            onPress={() => tafsirsQuery.refetch()}
          >
            <Text className="font-uiSemibold text-white">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          className="mt-4"
          data={data}
          keyExtractor={(item) => String(item.id)}
          ItemSeparatorComponent={() => <View className="h-2" />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const selected = item.id === tafsirId;
            return (
              <Pressable
                className={`rounded-2xl border px-4 py-3 active:opacity-80 ${
                  selected ? "border-primary bg-primaryMuted" : "border-border bg-surface"
                }`}
                onPress={() => {
                  setTafsirId(item.id);
                  router.back();
                }}
              >
                <Text className="font-uiSemibold text-sm text-text">{item.name}</Text>
                {item.language_name ? (
                  <Text className="mt-1 font-ui text-sm text-muted">{item.language_name}</Text>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
