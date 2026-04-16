import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { StatusBadge } from "@/components/StatusBadge";
import { colors } from "@/theme/colors";

const QUICK_ACTIONS = [
  {
    title: "Explain an ayah simply",
    body: "Open any verse to view tafsir and generate a simplified summary with context.",
    icon: "lightbulb-on-outline" as const,
    onPress: () => router.push("/quran"),
  },
  {
    title: "Search by meaning",
    body: "Look for a verse using a phrase, topic, or idea and jump into the reader.",
    icon: "text-search" as const,
    onPress: () => router.push("/search"),
  },
  {
    title: "Compare understanding",
    body: "Read translation, tafsir, and AI-assisted notes together without leaving the study flow.",
    icon: "book-open-variant" as const,
    onPress: () => router.push("/quran"),
  },
];

export default function AiTabScreen() {
  return (
    <Screen className="pt-6">
      <AppHeader title="Study" subtitle="Reflect, explore, and understand with respectful study tools." />

      <SectionCard>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="font-uiSemibold text-lg text-text">Study hub</Text>
            <Text className="mt-2 font-ui text-sm leading-6 text-muted">
              Use tafsir, translation, and AI summaries together. AI responses are assistive and should never replace authentic tafsir.
            </Text>
          </View>
          <StatusBadge label="Assistive only" tone="accent" />
        </View>
      </SectionCard>

      <ScrollView className="mt-4 flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="gap-4">
          {QUICK_ACTIONS.map((item) => (
            <Pressable
              key={item.title}
              className="rounded-3xl border border-border bg-surface px-5 py-5 active:opacity-80"
              onPress={item.onPress}
            >
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primaryMuted">
                <MaterialCommunityIcons name={item.icon} size={22} color={colors.primary} />
              </View>
              <Text className="mt-4 font-uiSemibold text-base text-text">{item.title}</Text>
              <Text className="mt-2 font-ui text-sm leading-6 text-muted">{item.body}</Text>
            </Pressable>
          ))}

          <SectionCard compact>
            <Text className="font-uiSemibold text-base text-text">Suggested next step</Text>
            <Text className="mt-2 font-ui text-sm leading-6 text-muted">
              Start from the Quran tab, open a verse, and use the tafsir sheet. That gives the cleanest path into detailed study without leaving the reading flow.
            </Text>
          </SectionCard>

          <EmptyState
            icon="star-four-points-outline"
            title="More guided study tools are coming"
            body="We will expand this area with surah themes, verse grouping, and deeper study helpers without turning the app into a noisy chat interface."
            actionLabel="Open Quran"
            onAction={() => router.push("/quran")}
            secondaryLabel="Search a verse"
            onSecondaryAction={() => router.push("/search")}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
