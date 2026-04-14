import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import RenderHTML from "react-native-render-html";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { fetchAiTafsir, isAiTafsirConfigured, type AiTafsirResponse } from "@/services/aiTafsirClient";
import { useTafsirQuery, useVerseByKeyQuery } from "@/hooks/quranQueries";
import { stripHtmlTags } from "@/utils/html";
import { useSettingsStore } from "@/store/settingsStore";

export default function TafsirScreen() {
  const { verseId: verseIdParam, verseKey: verseKeyParam } = useLocalSearchParams<{
    verseId?: string;
    verseKey?: string;
  }>();

  const verseId = Number(verseIdParam);
  const verseKey = typeof verseKeyParam === "string" ? verseKeyParam : "";
  const { width } = useWindowDimensions();

  const { tafsirId, translationId } = useSettingsStore();

  const verseQuery = useVerseByKeyQuery({
    verseKey,
    translationId,
    language: "en",
  });

  const tafsirQuery = useTafsirQuery({ tafsirId, verseId });

  const [aiBusy, setAiBusy] = useState(false);
  const [aiResult, setAiResult] = useState<AiTafsirResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const verseArabic = verseQuery.data?.text_uthmani ?? "";
  const verseTranslation = verseQuery.data?.translations?.[0]?.textPlain ?? "";

  const tafsirPlain = tafsirQuery.data?.plain ?? "";

  const html = useMemo(() => {
    const raw = tafsirQuery.data?.html ?? "";
    // Avoid huge inline styles from upstream by stripping style attributes.
    return raw.replace(/\sstyle=\"[^\"]*\"/g, "");
  }, [tafsirQuery.data?.html]);

  return (
    <Screen className="pt-6" padded={false}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-6">
        <AppHeader title="Tafsir" subtitle={verseKey ? `Verse ${verseKey}` : "Verse"} showBack />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="rounded-2xl border border-border bg-surface px-4 py-4">
          <Text className="font-uiSemibold text-base text-text">Verse</Text>
          {verseQuery.isLoading ? (
            <View className="mt-4 flex-row items-center">
              <ActivityIndicator />
              <Text className="ml-3 font-ui text-muted">Loading verse…</Text>
            </View>
          ) : verseQuery.isError ? (
            <Text className="mt-3 font-ui text-danger">Couldn’t load verse text.</Text>
          ) : (
            <>
              <Text
                className="mt-3 font-arabic text-text"
                style={{ writingDirection: "rtl", textAlign: "right", lineHeight: 54, fontSize: 28 }}
              >
                {verseArabic}
              </Text>
              {verseTranslation ? (
                <Text className="mt-3 font-serif text-sm text-muted">{verseTranslation}</Text>
              ) : null}
            </>
          )}
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4">
          <Text className="font-uiSemibold text-base text-text">Tafsir</Text>

          {tafsirQuery.isLoading ? (
            <View className="mt-4 flex-row items-center">
              <ActivityIndicator />
              <Text className="ml-3 font-ui text-muted">Loading tafsir…</Text>
            </View>
          ) : tafsirQuery.isError ? (
            <Text className="mt-3 font-ui text-danger">Couldn’t load tafsir.</Text>
          ) : (
            <RenderHTML
              contentWidth={width - 48}
              source={{ html }}
              baseStyle={{
                color: "#0F172A",
                fontFamily: "Inter_400Regular",
                lineHeight: 22,
              }}
              tagsStyles={{
                p: { marginTop: 10, marginBottom: 0 },
                h1: { fontSize: 18, marginTop: 12, marginBottom: 6 },
                h2: { fontSize: 16, marginTop: 12, marginBottom: 6 },
                li: { marginTop: 6 },
              }}
            />
          )}
        </View>

        <View className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4">
          <Text className="font-uiSemibold text-base text-text">AI Simplified</Text>
          <Text className="mt-2 font-ui text-sm text-muted">
            AI summaries can be imperfect. Treat as a reading aid, not a ruling.
          </Text>

          {!isAiTafsirConfigured() ? (
            <Text className="mt-3 font-ui text-sm text-muted">
              Configure `EXPO_PUBLIC_AI_TAFSIR_URL` to enable this.
            </Text>
          ) : (
            <Pressable
              className="mt-4 rounded-2xl bg-primary px-5 py-3 active:opacity-80"
              onPress={async () => {
                if (!verseKey || !verseArabic || !verseTranslation || !tafsirPlain) {
                  setAiError("Verse/tafsir data is missing.");
                  return;
                }
                setAiBusy(true);
                setAiError(null);
                try {
                  const result = await fetchAiTafsir({
                    verseKey,
                    arabicText: verseArabic,
                    translationText: verseTranslation,
                    tafsirText: tafsirPlain,
                  });
                  setAiResult(result);
                } catch (e) {
                  setAiError(e instanceof Error ? e.message : "Failed to generate.");
                } finally {
                  setAiBusy(false);
                }
              }}
              disabled={aiBusy}
            >
              <Text className="text-center font-uiSemibold text-white">
                {aiBusy ? "Generating…" : "Generate summary"}
              </Text>
            </Pressable>
          )}

          {aiError ? <Text className="mt-3 font-ui text-sm text-danger">{aiError}</Text> : null}

          {aiResult ? (
            <View className="mt-4">
              <Text className="font-uiSemibold text-sm text-text">Summary</Text>
              <Text className="mt-2 font-ui text-sm text-muted">{stripHtmlTags(aiResult.summary)}</Text>

              {aiResult.keyPoints?.length ? (
                <>
                  <Text className="mt-4 font-uiSemibold text-sm text-text">Key points</Text>
                  {aiResult.keyPoints.map((p, idx) => (
                    <Text key={idx} className="mt-2 font-ui text-sm text-muted">
                      • {stripHtmlTags(p)}
                    </Text>
                  ))}
                </>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

