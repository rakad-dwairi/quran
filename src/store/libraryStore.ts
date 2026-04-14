import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type LibraryVerse = {
  verseKey: string;
  chapterId: number;
  verseNumber: number;
  arabicText: string;
  translationText?: string;
  createdAt: number;
};

type LibraryState = {
  bookmarks: Record<string, LibraryVerse>;
  favorites: Record<string, LibraryVerse>;
};

type LibraryActions = {
  toggleBookmark: (verse: LibraryVerse) => void;
  toggleFavorite: (verse: LibraryVerse) => void;
  removeBookmark: (verseKey: string) => void;
  removeFavorite: (verseKey: string) => void;
  mergeFromCloud: (payload: { bookmarks?: Record<string, LibraryVerse>; favorites?: Record<string, LibraryVerse> }) => void;
  getSnapshot: () => { bookmarks: Record<string, LibraryVerse>; favorites: Record<string, LibraryVerse> };
  replaceAll: (payload: { bookmarks: Record<string, LibraryVerse>; favorites: Record<string, LibraryVerse> }) => void;
};

function mergeRecords(
  local: Record<string, LibraryVerse>,
  remote: Record<string, LibraryVerse>
): Record<string, LibraryVerse> {
  const out: Record<string, LibraryVerse> = { ...local };
  for (const [key, remoteVerse] of Object.entries(remote)) {
    const localVerse = out[key];
    if (!localVerse || remoteVerse.createdAt > localVerse.createdAt) {
      out[key] = remoteVerse;
    }
  }
  return out;
}

export const useLibraryStore = create<LibraryState & LibraryActions>()(
  persist(
    (set, get) => ({
      bookmarks: {},
      favorites: {},

      toggleBookmark: (verse) =>
        set((state) => {
          const next = { ...state.bookmarks };
          if (next[verse.verseKey]) {
            delete next[verse.verseKey];
          } else {
            next[verse.verseKey] = verse;
          }
          return { bookmarks: next };
        }),

      toggleFavorite: (verse) =>
        set((state) => {
          const next = { ...state.favorites };
          if (next[verse.verseKey]) {
            delete next[verse.verseKey];
          } else {
            next[verse.verseKey] = verse;
          }
          return { favorites: next };
        }),

      removeBookmark: (verseKey) =>
        set((state) => {
          const next = { ...state.bookmarks };
          delete next[verseKey];
          return { bookmarks: next };
        }),

      removeFavorite: (verseKey) =>
        set((state) => {
          const next = { ...state.favorites };
          delete next[verseKey];
          return { favorites: next };
        }),

      mergeFromCloud: (payload) =>
        set((state) => ({
          bookmarks: payload.bookmarks ? mergeRecords(state.bookmarks, payload.bookmarks) : state.bookmarks,
          favorites: payload.favorites ? mergeRecords(state.favorites, payload.favorites) : state.favorites,
        })),

      getSnapshot: () => {
        const state = get();
        return { bookmarks: state.bookmarks, favorites: state.favorites };
      },

      replaceAll: (payload) => set({ bookmarks: payload.bookmarks, favorites: payload.favorites }),
    }),
    {
      name: "library-v1",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);

