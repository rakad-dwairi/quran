import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  PRAYER_IDS,
  type PrayerAdhanSound,
  type PrayerCalculationMethod,
  type PrayerId,
  type PrayerMadhab,
  type PrayerReminderMinutes,
} from "@/constants/prayer";
import { buildPrayerTimes, getPrayerLabel, type PrayerCoordinates } from "@/services/prayerTimes";

const STORAGE_KEY = "prayer-notification-ids-v1";
const AUDIBLE_CHANNEL_ID = "prayer-times-audible-v1";
const SILENT_CHANNEL_ID = "prayer-times-silent-v1";
const SCHEDULE_BUFFER_MS = 30_000;
const DEFAULT_DAYS_AHEAD = 6;

export type PrayerNotificationSettings = {
  notificationsEnabled: boolean;
  adhanEnabled: boolean;
  adhanSound: PrayerAdhanSound;
  calculationMethod: PrayerCalculationMethod;
  madhab: PrayerMadhab;
  reminderMinutes: PrayerReminderMinutes;
  perPrayerNotifications: Record<PrayerId, boolean>;
};

type PrayerNotificationData = {
  type: "prayerTime";
  prayerId: PrayerId;
  reminder: boolean;
  playSound: boolean;
};

function addDays(date: Date, days: number) {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

async function getStoredIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) return parsed;
  } catch {
    // Ignore corrupt notification storage.
  }
  return [];
}

async function setStoredIds(ids: string[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function soundForAdhan(enabled: boolean, _sound: PrayerAdhanSound) {
  return enabled ? true : false;
}

function channelIdForSound(enabled: boolean) {
  return enabled ? AUDIBLE_CHANNEL_ID : SILENT_CHANNEL_ID;
}

export async function ensurePrayerNotificationChannels() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(AUDIBLE_CHANNEL_ID, {
    name: "Prayer alerts",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 120, 250],
    lightColor: "#0E4E39",
    sound: "default",
  });

  await Notifications.setNotificationChannelAsync(SILENT_CHANNEL_ID, {
    name: "Prayer alerts silent",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 160],
    lightColor: "#0E4E39",
    sound: null,
  });
}

export async function cancelPrayerNotifications() {
  const ids = await getStoredIds();
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  await setStoredIds([]);
}

export async function schedulePrayerNotifications({
  coords,
  place,
  settings,
  daysAhead = DEFAULT_DAYS_AHEAD,
}: {
  coords: PrayerCoordinates;
  place?: string | null;
  settings: PrayerNotificationSettings;
  daysAhead?: number;
}) {
  await ensurePrayerNotificationChannels();
  await cancelPrayerNotifications();

  if (!settings.notificationsEnabled) return { scheduledCount: 0 };

  const ids: string[] = [];
  const now = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const date = addDays(now, i);
    const built = buildPrayerTimes(coords, date, {
      calculationMethod: settings.calculationMethod,
      madhab: settings.madhab,
    });

    for (const prayerId of PRAYER_IDS) {
      if (!settings.perPrayerNotifications[prayerId]) continue;

      const prayerAt = built.times[prayerId];
      const label = getPrayerLabel(prayerId);
      if (prayerAt.getTime() > now.getTime() + SCHEDULE_BUFFER_MS) {
        const data: PrayerNotificationData = {
          type: "prayerTime",
          prayerId,
          reminder: false,
          playSound: settings.adhanEnabled,
        };

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `It is now ${label}`,
            body: place ? `Prayer time for ${place}.` : "Prayer time has arrived.",
            data,
            sound: soundForAdhan(settings.adhanEnabled, settings.adhanSound),
            color: "#0E4E39",
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: prayerAt,
            channelId: channelIdForSound(settings.adhanEnabled),
          },
        });
        ids.push(id);
      }

      if (settings.reminderMinutes > 0) {
        const reminderAt = addMinutes(prayerAt, -settings.reminderMinutes);
        if (reminderAt.getTime() > now.getTime() + SCHEDULE_BUFFER_MS) {
          const data: PrayerNotificationData = {
            type: "prayerTime",
            prayerId,
            reminder: true,
            playSound: false,
          };

          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: `${label} in ${settings.reminderMinutes} minutes`,
              body: place ? `Upcoming prayer for ${place}.` : "Upcoming prayer reminder.",
              data,
              sound: false,
              color: "#0E4E39",
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: reminderAt,
              channelId: SILENT_CHANNEL_ID,
            },
          });
          ids.push(id);
        }
      }
    }
  }

  await setStoredIds(ids);
  return { scheduledCount: ids.length };
}

export async function sendTestPrayerNotification({
  adhanEnabled,
  adhanSound,
}: {
  adhanEnabled: boolean;
  adhanSound: PrayerAdhanSound;
}) {
  await ensurePrayerNotificationChannels();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Prayer Alert (Test)",
      body: "This is how prayer alerts will appear.",
      data: {
        type: "prayerTime",
        prayerId: "asr",
        reminder: false,
        playSound: adhanEnabled,
      } satisfies PrayerNotificationData,
      sound: soundForAdhan(adhanEnabled, adhanSound),
      color: "#0E4E39",
    },
    trigger: {
      channelId: channelIdForSound(adhanEnabled),
    },
  });
}
