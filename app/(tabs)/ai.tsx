import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useAppLocale } from "@/i18n/useAppLocale";
import { colors } from "@/theme/colors";

export default function AiTabScreen() {
  const { t, textAlign } = useAppLocale();

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
