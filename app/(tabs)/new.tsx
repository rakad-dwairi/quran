import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { StatusBadge } from "@/components/StatusBadge";

const MODULES = [
  {
    title: "Nearby mosques",
    body: "Mosques, Jumu'ah locations, and prayer-related places will appear here once location-based discovery is enabled.",
    status: "Planned",
  },
  {
    title: "Islamic classes and lectures",
    body: "Verified classes, circles, and local events can live here without overwhelming the daily-use flow.",
    status: "Planned",
  },
  {
    title: "Islamic calendar highlights",
    body: "Important dates, seasonal reminders, and community announcements can be surfaced here in a calm format.",
    status: "Planned",
  },
];

export default function NewTabScreen() {
  return (
    <Screen className="pt-6">
      <AppHeader title="Discover" subtitle="Nearby Islamic updates, places, and useful community information." />

      <ScrollView className="mt-2 flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="gap-4">
          {MODULES.map((item) => (
            <SectionCard key={item.title}>
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="font-uiSemibold text-base text-text">{item.title}</Text>
                  <Text className="mt-2 font-ui text-sm leading-6 text-muted">{item.body}</Text>
                </View>
                <StatusBadge label={item.status} />
              </View>
            </SectionCard>
          ))}

          <EmptyState
            icon="map-marker-radius-outline"
            title="Nearby Islamic updates will appear here"
            body="We will show local mosques, classes, Jumu'ah locations, and community updates here when available."
            actionLabel="Open Prayers"
            onAction={() => router.push("/prayers")}
            secondaryLabel="Open Quran"
            onSecondaryAction={() => router.push("/quran")}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
