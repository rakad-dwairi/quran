import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useVerseByKeyQuery } from "@/hooks/quranQueries";
import { useAppLocale } from "@/i18n/useAppLocale";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/theme/colors";

function parseVerseKey(input: string): string | null {
  const trimmed = input.trim();
  const m = /^(\d{1,3})\s*[:\s]\s*(\d{1,3})$/.exec(trimmed);
  if (!m) return null;
  const chapter = Number(m[1]);
  const verse = Number(m[2]);
  if (!Number.isFinite(chapter) || !Number.isFinite(verse)) return null;
  if (chapter < 1 || chapter > 114) return null;
  if (verse < 1 || verse > 300) return null;
  return `${chapter}:${verse}`;
}

export default function AiTabScreen() {
  const { t, textAlign, isRTL } = useAppLocale();
  const [input, setInput] = useState("2:255");
  const verseKey = parseVerseKey(input);
  const translationId = useSettingsStore((s) => s.translationId);
  const verseQuery = useVerseByKeyQuery({
    verseKey: verseKey ?? "",
    translationId,
    language: "en",
    enabled: !!verseKey,
  });
  const chapterId = useMemo(() => (verseKey ? Number(verseKey.split(":")[0]) : null), [verseKey]);

  const quickActions = [
    {
      title: t("study.explainAyahTitle"),
      body: t("study.explainAyahBody"),
      icon: "lightbulb-on-outline" as const,
      onPress: () => router.push("/quran"),
    },
    {
      title: t("study.searchMeaningTitle"),
      body: t("study.searchMeaningBody"),
      icon: "text-search" as const,
      onPress: () => router.push("/search"),
    },
    {
      title: t("study.compareTitle"),
      body: t("study.compareBody"),
      icon: "book-open-variant" as const,
      onPress: () => router.push("/quran"),
    },
  ];

  return (
    <Screen className="pt-6">
      <AppHeader title={t("study.title")} subtitle={t("study.subtitle")} />

      <SectionCard>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="font-uiSemibold text-lg text-text" style={{ textAlign }}>{t("study.hubTitle")}</Text>
            <Text className="mt-2 font-ui text-sm leading-6 text-muted" style={{ textAlign }}>
              {t("study.hubBody")}
            </Text>
          </View>
          <StatusBadge label={t("study.assistiveOnly")} tone="accent" />
        </View>
      </SectionCard>

      <ScrollView className="mt-4 flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="gap-4">
          <SectionCard>
            <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>Study an ayah</Text>
            <Text className="mt-2 font-ui text-sm leading-6 text-muted" style={{ textAlign }}>
              Enter a reference, review the verse, then open tafsir and AI simplification.
            </Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Example: 2:255"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numbers-and-punctuation"
              className="mt-4 rounded-2xl border border-border bg-bg px-4 py-3 font-ui text-base text-text"
              style={{ textAlign, writingDirection: isRTL ? "rtl" : "ltr" }}
            />

            {!verseKey ? (
              <Text className="mt-3 font-ui text-sm text-danger">Use a verse reference like 1:1 or 2:255.</Text>
            ) : verseQuery.isLoading ? (
              <View className="mt-4 flex-row items-center">
                <ActivityIndicator size="small" color={colors.muted} />
                <Text className="ml-3 font-ui text-sm text-muted">Loading verse...</Text>
              </View>
            ) : verseQuery.isError ? (
              <Text className="mt-3 font-ui text-sm text-danger">Could not load this verse.</Text>
            ) : verseQuery.data ? (
              <View className="mt-4 rounded-2xl border border-border bg-bg px-4 py-4">
                <Text
                  className="font-arabic text-text"
                  style={{ fontSize: 26, lineHeight: 50, writingDirection: "rtl", textAlign: "right" }}
                >
                  {verseQuery.data.text_uthmani}
                </Text>
                {verseQuery.data.translations?.[0]?.textPlain ? (
                  <Text className="mt-3 font-serif text-sm leading-6 text-muted" style={{ textAlign }}>
                    {verseQuery.data.translations[0].textPlain}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View className="mt-4 flex-row gap-3">
              <Pressable
                className="flex-1 rounded-2xl bg-primary px-4 py-3 active:opacity-80"
                onPress={() => {
                  if (!verseKey || !verseQuery.data) return;
                  router.push({
                    pathname: "/tafsir",
                    params: { verseId: String(verseQuery.data.id), verseKey },
                  });
                }}
                disabled={!verseKey || !verseQuery.data}
              >
                <Text className="text-center font-uiSemibold text-sm text-primaryForeground">Open tafsir + AI</Text>
              </Pressable>
              <Pressable
                className="rounded-2xl border border-border bg-bg px-4 py-3 active:opacity-80"
                onPress={() => {
                  if (!chapterId || !verseKey) return;
                  router.push({ pathname: `/surah/${chapterId}`, params: { verseKey } });
                }}
                disabled={!chapterId}
              >
                <Text className="text-center font-uiSemibold text-sm text-text">Read</Text>
              </Pressable>
            </View>
          </SectionCard>

          {quickActions.map((item) => (
            <Pressable
              key={item.title}
              className="rounded-3xl border border-border bg-surface px-5 py-5 active:opacity-80"
              onPress={item.onPress}
            >
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primaryMuted">
                <MaterialCommunityIcons name={item.icon} size={22} color={colors.primary} />
              </View>
              <Text className="mt-4 font-uiSemibold text-base text-text" style={{ textAlign }}>{item.title}</Text>
              <Text className="mt-2 font-ui text-sm leading-6 text-muted" style={{ textAlign }}>{item.body}</Text>
            </Pressable>
          ))}

          <SectionCard compact>
            <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{t("study.nextStepTitle")}</Text>
            <Text className="mt-2 font-ui text-sm leading-6 text-muted" style={{ textAlign }}>
              {t("study.nextStepBody")}
            </Text>
          </SectionCard>

          <EmptyState
            icon="star-four-points-outline"
            title={t("study.comingSoonTitle")}
            body={t("study.comingSoonBody")}
            actionLabel={t("study.openQuran")}
            onAction={() => router.push("/quran")}
            secondaryLabel={t("study.searchVerse")}
            onSecondaryAction={() => router.push("/search")}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
