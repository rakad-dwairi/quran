import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { SectionCard } from "@/components/SectionCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useAppLocale } from "@/i18n/useAppLocale";

export default function NewTabScreen() {
  const { t, textAlign } = useAppLocale();

  const modules = [
    {
      title: t("discover.mosquesTitle"),
      body: t("discover.mosquesBody"),
    },
    {
      title: t("discover.classesTitle"),
      body: t("discover.classesBody"),
    },
    {
      title: t("discover.calendarTitle"),
      body: t("discover.calendarBody"),
    },
  ];

  return (
    <Screen className="pt-6">
      <AppHeader title={t("discover.title")} subtitle={t("discover.subtitle")} />

      <ScrollView className="mt-2 flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="gap-4">
          {modules.map((item) => (
            <SectionCard key={item.title}>
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="font-uiSemibold text-base text-text" style={{ textAlign }}>{item.title}</Text>
                  <Text className="mt-2 font-ui text-sm leading-6 text-muted" style={{ textAlign }}>{item.body}</Text>
                </View>
                <StatusBadge label={t("discover.planned")} />
              </View>
            </SectionCard>
          ))}

          <EmptyState
            icon="map-marker-radius-outline"
            title={t("discover.emptyTitle")}
            body={t("discover.emptyBody")}
            actionLabel={t("discover.openPrayers")}
            onAction={() => router.push("/prayers")}
            secondaryLabel={t("discover.openQuran")}
            onSecondaryAction={() => router.push("/quran")}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
