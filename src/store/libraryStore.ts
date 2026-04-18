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
  updatedAt?: number;
  note?: string;
  tags?: string[];
};

type LibraryState = {
  bookmarks: Record<string, LibraryVerse>;
  favorites: Record<string, LibraryVerse>;
  notes: Record<string, LibraryVerse>;
};

type LibraryActions = {
  toggleBookmark: (verse: LibraryVerse) => void;
  toggleFavorite: (verse: LibraryVerse) => void;
  saveNote: (verse: LibraryVerse, note: string, tags?: string[]) => void;
  removeNote: (verseKey: string) => void;
  removeBookmark: (verseKey: string) => void;
  removeFavorite: (verseKey: string) => void;
  mergeFromCloud: (payload: {
    bookmarks?: Record<string, LibraryVerse>;
    favorites?: Record<string, LibraryVerse>;
    notes?: Record<string, LibraryVerse>;
  }) => void;
  getSnapshot: () => {
    bookmarks: Record<string, LibraryVerse>;
    favorites: Record<string, LibraryVerse>;
    notes: Record<string, LibraryVerse>;
  };
  replaceAll: (payload: {
    bookmarks: Record<string, LibraryVerse>;
    favorites: Record<string, LibraryVerse>;
    notes?: Record<string, LibraryVerse>;
  }) => void;
};

function mergeRecords(
  local: Record<string, LibraryVerse>,
  remote: Record<string, LibraryVerse>
): Record<string, LibraryVerse> {
  const out: Record<string, LibraryVerse> = { ...local };
  for (const [key, remoteVerse] of Object.entries(remote)) {
    const localVerse = out[key];
    const remoteTime = remoteVerse.updatedAt ?? remoteVerse.createdAt;
    const localTime = localVerse ? localVerse.updatedAt ?? localVerse.createdAt : 0;
    if (!localVerse || remoteTime > localTime) {
      out[key] = remoteVerse;
    }
  }
  return out;
}

function normalizeTags(tags: string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags ?? []) {
    const next = tag.trim().replace(/^#/, "").toLowerCase();
    if (!next || seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }
  return out;
}

export const useLibraryStore = create<LibraryState & LibraryActions>()(
  persist(
    (set, get) => ({
      bookmarks: {},
      favorites: {},
      notes: {},

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

      saveNote: (verse, note, tags) =>
        set((state) => {
          const trimmedNote = note.trim();
          const next = { ...state.notes };
          if (!trimmedNote) {
            delete next[verse.verseKey];
            return { notes: next };
          }
          next[verse.verseKey] = {
            ...verse,
            note: trimmedNote,
            tags: normalizeTags(tags),
            updatedAt: Date.now(),
          };
          return { notes: next };
        }),

      removeNote: (verseKey) =>
        set((state) => {
          const next = { ...state.notes };
          delete next[verseKey];
          return { notes: next };
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
          notes: payload.notes ? mergeRecords(state.notes, payload.notes) : state.notes,
        })),

      getSnapshot: () => {
        const state = get();
        return { bookmarks: state.bookmarks, favorites: state.favorites, notes: state.notes };
      },

      replaceAll: (payload) =>
        set({
          bookmarks: payload.bookmarks,
          favorites: payload.favorites,
          notes: payload.notes ?? {},
        }),
    }),
    {
      name: "library-v1",
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted) => ({
        bookmarks: {},
        favorites: {},
        notes: {},
        ...(persisted as Partial<LibraryState>),
      }),
    }
  )
);
