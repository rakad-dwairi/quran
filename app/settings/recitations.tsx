import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { useRecitationsQuery } from "@/hooks/quranQueries";
import { useSettingsStore } from "@/store/settingsStore";

export default function RecitationsScreen() {
  const { recitationId, setRecitationId } = useSettingsStore();
  const recitationsQuery = useRecitationsQuery({ language: "en" });
  const [filter, setFilter] = useState("");

  const data = useMemo(() => {
    const list = recitationsQuery.data ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const hay = `${r.reciter_name} ${r.style ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [recitationsQuery.data, filter]);

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />

      <AppHeader title="Reciters" subtitle="Pick a recitation voice/style." showBack />

      <TextInput
        value={filter}
        onChangeText={setFilter}
        placeholder="Filter reciters…"
        placeholderTextColor="#94A3B8"
        autoCapitalize="none"
        autoCorrect={false}
        className="rounded-2xl border border-border bg-surface px-4 py-3 font-ui text-base text-text"
      />

      {recitationsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator />
          <Text className="mt-3 font-ui text-muted">Loading reciters…</Text>
        </View>
      ) : recitationsQuery.isError ? (
        <View className="mt-6 rounded-2xl border border-border bg-surface px-4 py-4">
          <Text className="font-uiSemibold text-base text-text">Couldn’t load reciters</Text>
          <Text className="mt-2 font-ui text-muted">Check your connection and try again.</Text>
          <Pressable
            className="mt-4 self-start rounded-2xl bg-primary px-4 py-2"
            onPress={() => recitationsQuery.refetch()}
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
            const selected = item.id === recitationId;
            return (
              <Pressable
                className={`rounded-2xl border px-4 py-3 active:opacity-80 ${
                  selected ? "border-primary bg-primaryMuted" : "border-border bg-surface"
                }`}
                onPress={() => {
                  setRecitationId(item.id);
                  router.back();
                }}
              >
                <Text className="font-uiSemibold text-sm text-text">{item.reciter_name}</Text>
                {item.style ? (
                  <Text className="mt-1 font-ui text-sm text-muted">{item.style}</Text>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

