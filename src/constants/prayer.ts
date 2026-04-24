export type PrayerId = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
export type PrayerCalculationMethod = "muslimWorldLeague" | "ummAlQura" | "egyptian" | "isna";
export type PrayerMadhab = "standard" | "hanafi";
export type PrayerLocationMode = "auto" | "manual";
export type PrayerAdhanSound = "adhan" | "default";
export type PrayerReminderMinutes = 0 | 5 | 10 | 15;

export const PRAYER_IDS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export const PRAYER_LABELS: Record<PrayerId, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export const PRAYER_NOTIFICATION_DEFAULTS: Record<PrayerId, boolean> = {
  fajr: true,
  dhuhr: true,
  asr: true,
  maghrib: true,
  isha: true,
};

export const PRAYER_CALCULATION_METHOD_OPTIONS: Array<{
  value: PrayerCalculationMethod;
  label: string;
}> = [
  { value: "muslimWorldLeague", label: "Muslim World League" },
  { value: "ummAlQura", label: "Umm al-Qura" },
  { value: "egyptian", label: "Egyptian" },
  { value: "isna", label: "ISNA" },
];

export const PRAYER_MADHAB_OPTIONS: Array<{ value: PrayerMadhab; label: string }> = [
  { value: "standard", label: "Standard" },
  { value: "hanafi", label: "Hanafi" },
];

export const PRAYER_REMINDER_OPTIONS: Array<{ value: PrayerReminderMinutes; label: string }> = [
  { value: 0, label: "Off" },
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 15, label: "15 minutes before" },
];

export const PRAYER_ADHAN_SOUND_OPTIONS: Array<{ value: PrayerAdhanSound; label: string }> = [
  { value: "adhan", label: "Athan alert sound" },
  { value: "default", label: "Default notification sound" },
];
