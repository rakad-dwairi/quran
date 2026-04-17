import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { tForLanguage } from "@/i18n";
import { type AppLanguage } from "@/i18n/config";

const STORAGE_KEY = "reading-plan-notification-ids-v1";
const CHANNEL_ID = "reading-plan";

type ReadingPlanData = {
  type: "readingPlan";
};

function makeScheduleDate(date: Date, hour: number, minute: number) {
  const out = new Date(date);
  out.setHours(hour, minute, 0, 0);
  return out;
}

async function getStoredIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) return parsed;
  } catch {
    // ignore malformed storage
  }
  return [];
}

async function setStoredIds(ids: string[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export async function ensureReadingPlanChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Reading Plan",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 120, 80, 120],
    lightColor: "#0E4E39",
  });
}

export async function cancelReadingPlanNotifications() {
  const ids = await getStoredIds();
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  await setStoredIds([]);
}

export async function scheduleReadingPlanNotifications({
  hour,
  minute,
  appLanguage,
  daysAhead = 14,
}: {
  hour: number;
  minute: number;
  appLanguage: AppLanguage;
  daysAhead?: number;
}) {
  await ensureReadingPlanChannel();
  await cancelReadingPlanNotifications();

  const now = new Date();
  const ids: string[] = [];
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const scheduled = makeScheduleDate(date, hour, minute);
    if (scheduled.getTime() <= now.getTime() + 30_000) continue;

    const data: ReadingPlanData = { type: "readingPlan" };
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: tForLanguage(appLanguage, "notifications.readingPlanTitle"),
        subtitle: tForLanguage(appLanguage, "notifications.readingPlanSubtitle"),
        body: tForLanguage(appLanguage, "notifications.readingPlanBody"),
        data,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduled,
        channelId: CHANNEL_ID,
      },
    });
    ids.push(id);
  }

  await setStoredIds(ids);
  return { scheduledCount: ids.length };
}

export async function sendTestReadingPlanNotification({ appLanguage }: { appLanguage: AppLanguage }) {
  await ensureReadingPlanChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: tForLanguage(appLanguage, "notifications.readingPlanTestTitle"),
      subtitle: tForLanguage(appLanguage, "notifications.readingPlanTestSubtitle"),
      body: tForLanguage(appLanguage, "notifications.readingPlanTestBody"),
      data: { type: "readingPlan" } satisfies ReadingPlanData,
    },
    trigger: null,
  });
}
