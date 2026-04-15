import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { useTranslationsQuery } from "@/hooks/quranQueries";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";

export default function TranslationsScreen() {
  const { translationId, setTranslationId } = useSettingsStore();
  const translationsQuery = useTranslationsQuery({ language: "en" });
  const [filter, setFilter] = useState("");

  const data = useMemo(() => {
    const list = translationsQuery.data ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) => {
      const hay = `${t.name} ${t.author_name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [translationsQuery.data, filter]);

  return (
    <Screen className="pt-6">
      <Stack.Screen options={{ headerShown: false }} />

      <AppHeader title="Translations" subtitle="Pick a translation for the reading view." showBack />

      <TextInput
        value={filter}
        onChangeText={setFilter}
        placeholder="Filter translations…"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        className="rounded-2xl border border-border bg-surface px-4 py-3 font-ui text-base text-text"
      />

      {translationsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator />
          <Text className="mt-3 font-ui text-muted">Loading translations…</Text>
        </View>
      ) : translationsQuery.isError ? (
        <View className="mt-6 rounded-2xl border border-border bg-surface px-4 py-4">
          <Text className="font-uiSemibold text-base text-text">Couldn’t load translations</Text>
          <Text className="mt-2 font-ui text-muted">Check your connection and try again.</Text>
          <Pressable
            className="mt-4 self-start rounded-2xl bg-primary px-4 py-2"
            onPress={() => translationsQuery.refetch()}
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
            const selected = item.id === translationId;
            return (
              <Pressable
                className={`rounded-2xl border px-4 py-3 active:opacity-80 ${
                  selected ? "border-primary bg-primaryMuted" : "border-border bg-surface"
                }`}
                onPress={() => {
                  setTranslationId(item.id);
                  router.back();
                }}
              >
                <Text className="font-uiSemibold text-sm text-text">{item.name}</Text>
                {item.author_name ? (
                  <Text className="mt-1 font-ui text-sm text-muted">{item.author_name}</Text>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
