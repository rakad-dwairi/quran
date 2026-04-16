import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { tForLanguage } from "@/i18n";
import { type AppLanguage } from "@/i18n/config";
import { pickVerseKeyForDate } from "@/services/dailyVerse";
import { getChapters, getVerseByKey, type Chapter } from "@/services/quranComApi";

const STORAGE_KEY = "daily-verse-notification-ids-v1";
const CHANNEL_ID = "daily-verse";

type DailyVerseData = {
  type: "dailyVerse";
  verseKey: string;
  chapterId: number;
};

function makeScheduleDate(date: Date, hour: number, minute: number) {
  const out = new Date(date);
  out.setHours(hour, minute, 0, 0);
  return out;
}

function clampText(input: string, maxLen: number) {
  const trimmed = input.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}...`;
}

async function getStoredIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) return parsed;
  } catch {
    // ignore
  }
  return [];
}

async function setStoredIds(ids: string[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export async function ensureDailyVerseChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Daily Verse",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 150, 80, 150],
    lightColor: "#0E4E39",
  });
}

export async function cancelDailyVerseNotifications() {
  const ids = await getStoredIds();
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  await setStoredIds([]);
}

async function buildDailyVerseContent(
  date: Date,
  translationId: number | null,
  chapters: Chapter[],
  appLanguage: AppLanguage
) {
  const { verseKey, chapterId, chapterName } = pickVerseKeyForDate(date, chapters);

  let body = tForLanguage(appLanguage, "notifications.dailyVerseFallbackBody", { verseKey });
  try {
    const verse = await getVerseByKey(verseKey, { translationId, language: "en" });
    const translation = verse.translations?.[0]?.textPlain ?? "";
    const arabic = verse.text_uthmani ?? "";
    const snippet = translation || arabic;
    body = snippet ? clampText(snippet, 170) : body;
  } catch {
    // Keep fallback body.
  }

  const data: DailyVerseData = { type: "dailyVerse", verseKey, chapterId };
  return {
    title: tForLanguage(appLanguage, "notifications.dailyVerseTitle"),
    subtitle: tForLanguage(appLanguage, "notifications.dailyVerseSubtitle", { verseKey, chapterName }),
    body,
    data,
  } satisfies Notifications.NotificationContentInput;
}

export async function scheduleDailyVerseNotifications({
  hour,
  minute,
  translationId,
  appLanguage,
  daysAhead = 14,
}: {
  hour: number;
  minute: number;
  translationId: number | null;
  appLanguage: AppLanguage;
  daysAhead?: number;
}) {
  await ensureDailyVerseChannel();
  await cancelDailyVerseNotifications();

  const chapters = await getChapters("en");
  const now = new Date();
  const ids: string[] = [];

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const scheduled = makeScheduleDate(date, hour, minute);
    if (scheduled.getTime() <= now.getTime() + 30_000) continue;

    const content = await buildDailyVerseContent(scheduled, translationId, chapters, appLanguage);
    const id = await Notifications.scheduleNotificationAsync({
      content,
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

export async function sendTestDailyVerseNotification({
  translationId,
  appLanguage,
}: {
  translationId: number | null;
  appLanguage: AppLanguage;
}) {
  await ensureDailyVerseChannel();
  const chapters = await getChapters("en");
  const content = await buildDailyVerseContent(new Date(), translationId, chapters, appLanguage);

  await Notifications.scheduleNotificationAsync({
    content: {
      ...content,
      title: tForLanguage(appLanguage, "notifications.dailyVerseTestTitle"),
    },
    trigger: null,
  });
}
