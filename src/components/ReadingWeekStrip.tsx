import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { addDays, toDayKey } from "@/utils/readingPlan";

type ReadingWeekStripProps = {
  activityDays: string[];
  now?: Date;
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

export function ReadingWeekStrip({ activityDays, now = new Date() }: ReadingWeekStripProps) {
  const { t } = useTranslation();
  const activitySet = new Set(activityDays);
  const todayKey = toDayKey(now);
  const week = Array.from({ length: 7 }, (_, idx) => {
    const offsetFromToday = idx - 6;
    const dayKey = addDays(todayKey, offsetFromToday);
    const date = new Date(`${dayKey}T00:00:00.000Z`);
    return {
      dayKey,
      dayLabel: DAY_LABELS[date.getUTCDay()],
      completed: activitySet.has(dayKey),
      isToday: dayKey === todayKey,
    };
  });

  return (
    <View className="mt-3">
      <View className="flex-row items-center justify-between">
        {week.map((item) => (
          <View key={item.dayKey} className="items-center gap-1">
            <View
              className={`h-7 w-7 items-center justify-center rounded-full border ${
                item.completed ? "border-primary bg-primary" : "border-border bg-bg"
              } ${item.isToday ? "border-2" : ""}`}
            >
              <Text className={`font-uiSemibold text-xs ${item.completed ? "text-primaryForeground" : "text-muted"}`}>
                {item.dayLabel}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View className="mt-3 flex-row flex-wrap items-center gap-4">
        <View className="flex-row items-center">
          <View className="h-2.5 w-2.5 rounded-full bg-primary" />
          <Text className="ml-1.5 font-ui text-xs text-muted">{t("readingPlan.legendCompleted")}</Text>
        </View>
        <View className="flex-row items-center">
          <View className="h-2.5 w-2.5 rounded-full border border-border bg-bg" />
          <Text className="ml-1.5 font-ui text-xs text-muted">{t("readingPlan.legendMissed")}</Text>
        </View>
        <View className="flex-row items-center">
          <View className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-bg" />
          <Text className="ml-1.5 font-ui text-xs text-muted">{t("readingPlan.legendToday")}</Text>
        </View>
      </View>
    </View>
  );
}
