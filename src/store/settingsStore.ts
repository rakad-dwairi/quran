import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
    }),
    {
      name: "settings-v1",
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted) => {
        if (!persisted || typeof persisted !== "object") return persisted as any;
        const state = { ...(persisted as Record<string, unknown>) };
        if (state.verseLayout === "page") state.verseLayout = "mushaf";
        return state as any;
      },
    }
  )
);
