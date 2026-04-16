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
import {
  detectDeviceAppLanguage,
  detectDeviceRegion,
  getTafsirIdForLanguage,
  getTranslationIdForLanguage,
  type AppLanguage,
  type CalendarPreference,
  type QuranContentLanguage,
  type QuranReadingMode,
  type TafsirLanguage,
} from "@/i18n/config";

type ThemeMode = "light" | "dark" | "sepia";
type VerseLayout = "cards" | "mushaf";

type SettingsState = {
  appLanguage: AppLanguage;
  localizationSetupComplete: boolean;
  quranTranslationLanguage: QuranContentLanguage;
  tafsirLanguage: TafsirLanguage;
  showTransliteration: boolean;
  regionCountry: string;
  calendarPreference: CalendarPreference;

  theme: ThemeMode;
  translationId: number | null;
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

  lastReadChapterId: number | null;
  lastReadVerseKey: string | null;
  lastReadAt: number | null;
  readingStreak: number;
  readingStreakDate: string | null;
};

type SettingsActions = {
  setAppLanguage: (language: AppLanguage) => void;
  setLocalizationSetupComplete: (complete: boolean) => void;
  completeLocalizationSetup: (payload: {
    appLanguage: AppLanguage;
    readingMode: QuranReadingMode;
    translationLanguage: QuranContentLanguage;
  }) => void;
  setQuranTranslationLanguage: (language: QuranContentLanguage) => void;
  setTafsirLanguage: (language: TafsirLanguage) => void;
  setShowTransliteration: (showTransliteration: boolean) => void;
  setRegionCountry: (regionCountry: string) => void;
  setCalendarPreference: (calendarPreference: CalendarPreference) => void;

  setTheme: (theme: ThemeMode) => void;
  setTranslationId: (translationId: number | null) => void;
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

  recordReadingProgress: (payload: { chapterId: number; verseKey: string; at?: Date }) => void;
};

const DEFAULTS: SettingsState = {
  appLanguage: detectDeviceAppLanguage(),
  localizationSetupComplete: false,
  quranTranslationLanguage: "en",
  tafsirLanguage: "en",
  showTransliteration: false,
  regionCountry: detectDeviceRegion(),
  calendarPreference: "gregorian",

  theme: "light",
  // Quran.com: 85 = M.A.S. Abdel Haleem (English)
  translationId: getTranslationIdForLanguage("en"),
  // Quran.com: 7 = Mishari Alafasy (Murattal) for chapter audio; also works for verse audio via verses/by_chapter.
  recitationId: 7,
  // Quran.com: 169 = Ibn Kathir (Abridged)
  tafsirId: getTafsirIdForLanguage("en"),
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

  lastReadChapterId: null,
  lastReadVerseKey: null,
  lastReadAt: null,
  readingStreak: 0,
  readingStreakDate: null,
};

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dayKey: string, days: number) {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDayKey(date);
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      setAppLanguage: (appLanguage) => set({ appLanguage }),
      setLocalizationSetupComplete: (localizationSetupComplete) => set({ localizationSetupComplete }),
      completeLocalizationSetup: ({ appLanguage, readingMode, translationLanguage }) =>
        set({
          appLanguage,
          localizationSetupComplete: true,
          quranTranslationLanguage: translationLanguage,
          translationId: getTranslationIdForLanguage(translationLanguage),
          showTranslation: readingMode !== "arabicOnly",
          showTransliteration: readingMode === "translationTransliteration",
          tafsirLanguage: appLanguage === "ar" ? "ar" : "en",
          tafsirId: getTafsirIdForLanguage(appLanguage === "ar" ? "ar" : "en"),
        }),
      setQuranTranslationLanguage: (quranTranslationLanguage) =>
        set({
          quranTranslationLanguage,
          translationId: getTranslationIdForLanguage(quranTranslationLanguage),
        }),
      setTafsirLanguage: (tafsirLanguage) =>
        set({
          tafsirLanguage,
          tafsirId: getTafsirIdForLanguage(tafsirLanguage),
        }),
      setShowTransliteration: (showTransliteration) => set({ showTransliteration }),
      setRegionCountry: (regionCountry) => set({ regionCountry }),
      setCalendarPreference: (calendarPreference) => set({ calendarPreference }),
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
      recordReadingProgress: ({ chapterId, verseKey, at = new Date() }) =>
        set((state) => {
          const dayKey = toDayKey(at);
          let nextStreak = state.readingStreak;

          if (state.readingStreakDate !== dayKey) {
            if (state.readingStreakDate === addDays(dayKey, -1)) {
              nextStreak = Math.max(1, state.readingStreak + 1);
            } else {
              nextStreak = 1;
            }
          }

          return {
            lastReadChapterId: chapterId,
            lastReadVerseKey: verseKey,
            lastReadAt: at.getTime(),
            readingStreak: nextStreak,
            readingStreakDate: dayKey,
          };
        }),
    }),
    {
      name: "settings-v1",
      storage: createJSONStorage(() => AsyncStorage),
      version: 5,
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
        const quranTranslationLanguage = (state.quranTranslationLanguage as QuranContentLanguage | undefined) ?? "en";
        state.quranTranslationLanguage = quranTranslationLanguage;
        state.translationId =
          state.translationId === null || typeof state.translationId === "number"
            ? state.translationId
            : getTranslationIdForLanguage(quranTranslationLanguage);
        state.tafsirLanguage = ((state.tafsirLanguage as TafsirLanguage | undefined) ?? "en") as TafsirLanguage;
        state.tafsirId =
          typeof state.tafsirId === "number" && state.tafsirId > 0
            ? state.tafsirId
            : getTafsirIdForLanguage(state.tafsirLanguage);
        state.appLanguage = ((state.appLanguage as AppLanguage | undefined) ?? detectDeviceAppLanguage()) as AppLanguage;
        state.regionCountry =
          typeof state.regionCountry === "string" ? state.regionCountry : detectDeviceRegion();
        state.calendarPreference =
          state.calendarPreference === "hijri" ? "hijri" : "gregorian";
        state.showTransliteration = Boolean(state.showTransliteration);
        state.localizationSetupComplete = Boolean(state.localizationSetupComplete);
        return state as any;
      },
    }
  )
);
