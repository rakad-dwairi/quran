import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  PRAYER_NOTIFICATION_DEFAULTS,
  type PrayerAdhanSound,
  type PrayerCalculationMethod,
  type PrayerId,
  type PrayerLocationMode,
  type PrayerMadhab,
  type PrayerReminderMinutes,
} from "@/constants/prayer";

type ThemeMode = "light" | "dark" | "sepia";
type VerseLayout = "cards" | "mushaf";

type SettingsState = {
  theme: ThemeMode;
  translationId: number;
  recitationId: number;
  tafsirId: number;
  showTranslation: boolean;
  arabicFontSize: number;
  translationFontSize: number;
  verseLayout: VerseLayout;

  dailyVerseEnabled: boolean;
  dailyVerseHour: number;
  dailyVerseMinute: number;

  prayerNotificationsEnabled: boolean;
  prayerAdhanEnabled: boolean;
  prayerAdhanSound: PrayerAdhanSound;
  prayerCalculationMethod: PrayerCalculationMethod;
  prayerMadhab: PrayerMadhab;
  prayerLocationMode: PrayerLocationMode;
  prayerManualCity: string;
  prayerManualCountry: string;
  prayerManualLatitude: number | null;
  prayerManualLongitude: number | null;
  prayerReminderMinutes: PrayerReminderMinutes;
  prayerPerPrayerNotifications: Record<PrayerId, boolean>;
};

type SettingsActions = {
  setTheme: (theme: ThemeMode) => void;
  setTranslationId: (translationId: number) => void;
  setRecitationId: (recitationId: number) => void;
  setTafsirId: (tafsirId: number) => void;
  setShowTranslation: (showTranslation: boolean) => void;
  bumpArabicFontSize: (delta: number) => void;
  bumpTranslationFontSize: (delta: number) => void;
  setVerseLayout: (layout: VerseLayout) => void;

  setDailyVerseEnabled: (enabled: boolean) => void;
  setDailyVerseTime: (hour: number, minute: number) => void;

  setPrayerNotificationsEnabled: (enabled: boolean) => void;
  setPrayerAdhanEnabled: (enabled: boolean) => void;
  setPrayerAdhanSound: (sound: PrayerAdhanSound) => void;
  setPrayerCalculationMethod: (method: PrayerCalculationMethod) => void;
  setPrayerMadhab: (madhab: PrayerMadhab) => void;
  setPrayerLocationMode: (mode: PrayerLocationMode) => void;
  setPrayerManualLocation: (location: {
    city: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  }) => void;
  setPrayerReminderMinutes: (minutes: PrayerReminderMinutes) => void;
  setPrayerNotificationForPrayer: (prayerId: PrayerId, enabled: boolean) => void;
};

const DEFAULTS: SettingsState = {
  theme: "light",
  // Quran.com: 85 = M.A.S. Abdel Haleem (English)
  translationId: 85,
  // Quran.com: 7 = Mishari Alafasy (Murattal) for chapter audio; also works for verse audio via verses/by_chapter.
  recitationId: 7,
  // Quran.com: 169 = Ibn Kathir (Abridged)
  tafsirId: 169,
  showTranslation: true,
  arabicFontSize: 28,
  translationFontSize: 16,
  verseLayout: "cards",

  dailyVerseEnabled: false,
  dailyVerseHour: 8,
  dailyVerseMinute: 0,

  prayerNotificationsEnabled: false,
  prayerAdhanEnabled: false,
  prayerAdhanSound: "default",
  prayerCalculationMethod: "muslimWorldLeague",
  prayerMadhab: "standard",
  prayerLocationMode: "auto",
  prayerManualCity: "",
  prayerManualCountry: "",
  prayerManualLatitude: null,
  prayerManualLongitude: null,
  prayerReminderMinutes: 0,
  prayerPerPrayerNotifications: { ...PRAYER_NOTIFICATION_DEFAULTS },
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      setTheme: (theme) => set({ theme }),
      setTranslationId: (translationId) => set({ translationId }),
      setRecitationId: (recitationId) => set({ recitationId }),
      setTafsirId: (tafsirId) => set({ tafsirId }),
      setShowTranslation: (showTranslation) => set({ showTranslation }),
      bumpArabicFontSize: (delta) => {
        const next = Math.max(18, Math.min(44, get().arabicFontSize + delta));
        set({ arabicFontSize: next });
      },
      bumpTranslationFontSize: (delta) => {
        const next = Math.max(12, Math.min(26, get().translationFontSize + delta));
        set({ translationFontSize: next });
      },
      setVerseLayout: (layout) => set({ verseLayout: layout }),

      setDailyVerseEnabled: (enabled) => set({ dailyVerseEnabled: enabled }),
      setDailyVerseTime: (hour, minute) => set({ dailyVerseHour: hour, dailyVerseMinute: minute }),

      setPrayerNotificationsEnabled: (enabled) => set({ prayerNotificationsEnabled: enabled }),
      setPrayerAdhanEnabled: (enabled) => set({ prayerAdhanEnabled: enabled }),
      setPrayerAdhanSound: (sound) => set({ prayerAdhanSound: sound }),
      setPrayerCalculationMethod: (method) => set({ prayerCalculationMethod: method }),
      setPrayerMadhab: (madhab) => set({ prayerMadhab: madhab }),
      setPrayerLocationMode: (mode) => set({ prayerLocationMode: mode }),
      setPrayerManualLocation: ({ city, country, latitude, longitude }) =>
        set({
          prayerManualCity: city,
          prayerManualCountry: country,
          prayerManualLatitude: latitude,
          prayerManualLongitude: longitude,
        }),
      setPrayerReminderMinutes: (minutes) => set({ prayerReminderMinutes: minutes }),
      setPrayerNotificationForPrayer: (prayerId, enabled) =>
        set((state) => ({
          prayerPerPrayerNotifications: {
            ...state.prayerPerPrayerNotifications,
            [prayerId]: enabled,
          },
        })),
    }),
    {
      name: "settings-v1",
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: (persisted) => {
        if (!persisted || typeof persisted !== "object") return persisted as any;
        const state = {
          ...DEFAULTS,
          ...(persisted as Record<string, unknown>),
        };
        if ((state.verseLayout as unknown) === "page") state.verseLayout = "mushaf";
        state.prayerPerPrayerNotifications = {
          ...PRAYER_NOTIFICATION_DEFAULTS,
          ...((state.prayerPerPrayerNotifications as Record<string, boolean> | undefined) ?? {}),
        };
        return state as any;
      },
    }
  )
);
