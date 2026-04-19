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

export type VerseCollection = {
  id: string;
  name: string;
  verseKeys: string[];
  createdAt: number;
  updatedAt: number;
};

export type MemorizedVerse = LibraryVerse & {
  memorizedAt: number;
  reviewCount: number;
  lastReviewedAt?: number;
};

type LibraryState = {
  bookmarks: Record<string, LibraryVerse>;
  favorites: Record<string, LibraryVerse>;
  notes: Record<string, LibraryVerse>;
  collections: Record<string, VerseCollection>;
  memorized: Record<string, MemorizedVerse>;
};

type LibraryActions = {
  toggleBookmark: (verse: LibraryVerse) => void;
  toggleFavorite: (verse: LibraryVerse) => void;
  saveNote: (verse: LibraryVerse, note: string, tags?: string[]) => void;
  removeNote: (verseKey: string) => void;
  upsertCollection: (name: string, id?: string) => string;
  removeCollection: (id: string) => void;
  toggleVerseInCollection: (collectionId: string, verse: LibraryVerse) => void;
  toggleMemorized: (verse: LibraryVerse) => void;
  markMemorizedReviewed: (verseKey: string) => void;
  removeBookmark: (verseKey: string) => void;
  removeFavorite: (verseKey: string) => void;
  mergeFromCloud: (payload: {
    bookmarks?: Record<string, LibraryVerse>;
    favorites?: Record<string, LibraryVerse>;
    notes?: Record<string, LibraryVerse>;
    collections?: Record<string, VerseCollection>;
    memorized?: Record<string, MemorizedVerse>;
  }) => void;
  getSnapshot: () => {
    bookmarks: Record<string, LibraryVerse>;
    favorites: Record<string, LibraryVerse>;
    notes: Record<string, LibraryVerse>;
    collections: Record<string, VerseCollection>;
    memorized: Record<string, MemorizedVerse>;
  };
  replaceAll: (payload: {
    bookmarks: Record<string, LibraryVerse>;
    favorites: Record<string, LibraryVerse>;
    notes?: Record<string, LibraryVerse>;
    collections?: Record<string, VerseCollection>;
    memorized?: Record<string, MemorizedVerse>;
  }) => void;
};

function mergeRecords<T extends LibraryVerse>(
  local: Record<string, T>,
  remote: Record<string, T>
): Record<string, T> {
  const out: Record<string, T> = { ...local };
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

function makeCollectionId(name: string) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "collection"}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useLibraryStore = create<LibraryState & LibraryActions>()(
  persist(
    (set, get) => ({
      bookmarks: {},
      favorites: {},
      notes: {},
      collections: {},
      memorized: {},

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

      upsertCollection: (name, id) => {
        const trimmed = name.trim();
        if (!trimmed) return "";
        const collectionId = id ?? makeCollectionId(trimmed);
        const now = Date.now();
        set((state) => ({
          collections: {
            ...state.collections,
            [collectionId]: {
              id: collectionId,
              name: trimmed,
              verseKeys: state.collections[collectionId]?.verseKeys ?? [],
              createdAt: state.collections[collectionId]?.createdAt ?? now,
              updatedAt: now,
            },
          },
        }));
        return collectionId;
      },

      removeCollection: (id) =>
        set((state) => {
          const next = { ...state.collections };
          delete next[id];
          return { collections: next };
        }),

      toggleVerseInCollection: (collectionId, verse) =>
        set((state) => {
          const collection = state.collections[collectionId];
          if (!collection) return {};
          const hasVerse = collection.verseKeys.includes(verse.verseKey);
          const verseKeys = hasVerse
            ? collection.verseKeys.filter((key) => key !== verse.verseKey)
            : [verse.verseKey, ...collection.verseKeys];
          return {
            collections: {
              ...state.collections,
              [collectionId]: {
                ...collection,
                verseKeys,
                updatedAt: Date.now(),
              },
            },
            favorites: state.favorites[verse.verseKey]
              ? state.favorites
              : { ...state.favorites, [verse.verseKey]: verse },
          };
        }),

      toggleMemorized: (verse) =>
        set((state) => {
          const next = { ...state.memorized };
          if (next[verse.verseKey]) {
            delete next[verse.verseKey];
          } else {
            next[verse.verseKey] = {
              ...verse,
              memorizedAt: Date.now(),
              reviewCount: 0,
              updatedAt: Date.now(),
            };
          }
          return { memorized: next };
        }),

      markMemorizedReviewed: (verseKey) =>
        set((state) => {
          const item = state.memorized[verseKey];
          if (!item) return {};
          return {
            memorized: {
              ...state.memorized,
              [verseKey]: {
                ...item,
                reviewCount: item.reviewCount + 1,
                lastReviewedAt: Date.now(),
                updatedAt: Date.now(),
              },
            },
          };
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
          collections: payload.collections
            ? { ...state.collections, ...payload.collections }
            : state.collections,
          memorized: payload.memorized ? mergeRecords(state.memorized, payload.memorized) : state.memorized,
        })),

      getSnapshot: () => {
        const state = get();
        return {
          bookmarks: state.bookmarks,
          favorites: state.favorites,
          notes: state.notes,
          collections: state.collections,
          memorized: state.memorized,
        };
      },

      replaceAll: (payload) =>
        set({
          bookmarks: payload.bookmarks,
          favorites: payload.favorites,
          notes: payload.notes ?? {},
          collections: payload.collections ?? {},
          memorized: payload.memorized ?? {},
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
        collections: {},
        memorized: {},
        ...(persisted as Partial<LibraryState>),
      }),
    }
  )
);
