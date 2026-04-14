import { Audio, InterruptionModeAndroid, InterruptionModeIOS, type AVPlaybackStatus } from "expo-av";
import { create } from "zustand";
import { getVerseAudioUrl } from "@/services/quranComApi";
import type { Verse } from "@/services/quranComApi";

type PlaybackMode = "chapter" | "verse";

type VerseTrack = {
  verseKey: string;
  uri: string;
};

type AudioState = {
  mode: PlaybackMode;
  chapterId: number | null;
  title: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  positionMillis: number;
  durationMillis: number;
  queue: VerseTrack[] | null;
  queueIndex: number;
  error: string | null;
};

type AudioActions = {
  playChapter: (opts: { chapterId: number; title: string; uri: string }) => Promise<void>;
  playVerseQueue: (opts: { chapterId: number; title: string; verses: Verse[]; startVerseKey?: string }) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  stop: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seekTo: (positionMillis: number) => Promise<void>;
};

let sound: Audio.Sound | null = null;
let audioInitialized = false;
let loadToken = 0;

async function ensureAudioMode() {
  if (audioInitialized) return;
  audioInitialized = true;
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  });
}

async function unloadSound() {
  if (!sound) return;
  try {
    sound.setOnPlaybackStatusUpdate(null);
    await sound.unloadAsync();
  } finally {
    sound = null;
  }
}

function statusToState(status: AVPlaybackStatus) {
  if (!status.isLoaded) {
    return {
      isPlaying: false,
      isLoading: false,
      positionMillis: 0,
      durationMillis: 0,
      error: status.error ?? null,
    };
  }
  return {
    isPlaying: status.isPlaying,
    isLoading: status.isBuffering,
    positionMillis: status.positionMillis,
    durationMillis: status.durationMillis ?? 0,
    error: null,
  };
}

async function loadAndPlay(uri: string, onStatus: (status: AVPlaybackStatus) => void) {
  await ensureAudioMode();
  const myToken = ++loadToken;

  await unloadSound();
  if (myToken !== loadToken) return;

  const next = new Audio.Sound();
  sound = next;
  next.setOnPlaybackStatusUpdate(onStatus);

  await next.loadAsync(
    { uri },
    { shouldPlay: true, progressUpdateIntervalMillis: 500 },
    true
  );
}

export const useAudioStore = create<AudioState & AudioActions>((set, get) => ({
  mode: "chapter",
  chapterId: null,
  title: null,
  isPlaying: false,
  isLoading: false,
  positionMillis: 0,
  durationMillis: 0,
  queue: null,
  queueIndex: 0,
  error: null,

  playChapter: async ({ chapterId, title, uri }) => {
    set({
      mode: "chapter",
      chapterId,
      title,
      queue: null,
      queueIndex: 0,
      isLoading: true,
      error: null,
    });

    await loadAndPlay(uri, (status) => {
      const snapshot = get();
      if (snapshot.mode !== "chapter" || snapshot.chapterId !== chapterId) return;

      set(statusToState(status));
      if (status.isLoaded && status.didJustFinish) {
        set({ isPlaying: false, positionMillis: 0 });
      }
    });
  },

  playVerseQueue: async ({ chapterId, title, verses, startVerseKey }) => {
    const tracks: VerseTrack[] = verses
      .map((v) => {
        const url = v.audio?.url;
        if (!url) return null;
        return { verseKey: v.verse_key, uri: getVerseAudioUrl(url) } as VerseTrack;
      })
      .filter((t): t is VerseTrack => !!t);

    const startIndex = startVerseKey ? Math.max(0, tracks.findIndex((t) => t.verseKey === startVerseKey)) : 0;

    set({
      mode: "verse",
      chapterId,
      title,
      queue: tracks,
      queueIndex: startIndex,
      isLoading: true,
      error: null,
    });

    const track = tracks[startIndex];
    if (!track) {
      set({ isLoading: false, error: "No verse audio available for this recitation." });
      return;
    }

    await loadAndPlay(track.uri, (status) => {
      const snapshot = get();
      if (snapshot.mode !== "verse" || snapshot.chapterId !== chapterId) return;

      set(statusToState(status));
      if (status.isLoaded && status.didJustFinish) {
        get().next().catch(() => {});
      }
    });
  },

  togglePlayPause: async () => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await sound.pauseAsync();
      set({ isPlaying: false });
    } else {
      await sound.playAsync();
      set({ isPlaying: true });
    }
  },

  stop: async () => {
    await unloadSound();
    set({
      isPlaying: false,
      isLoading: false,
      positionMillis: 0,
      durationMillis: 0,
      error: null,
      mode: "chapter",
      chapterId: null,
      title: null,
      queue: null,
      queueIndex: 0,
    });
  },

  next: async () => {
    const { mode, queue, queueIndex } = get();
    if (mode !== "verse" || !queue) return;
    const nextIndex = queueIndex + 1;
    const track = queue[nextIndex];
    if (!track) {
      await get().stop();
      return;
    }

    set({ queueIndex: nextIndex, isLoading: true, positionMillis: 0, durationMillis: 0, error: null });
    await loadAndPlay(track.uri, (status) => {
      const snapshot = get();
      if (snapshot.mode !== "verse") return;
      set(statusToState(status));
      if (status.isLoaded && status.didJustFinish) {
        get().next().catch(() => {});
      }
    });
  },

  previous: async () => {
    const { mode, queue, queueIndex } = get();
    if (mode !== "verse" || !queue) return;
    const prevIndex = Math.max(0, queueIndex - 1);
    const track = queue[prevIndex];
    if (!track) return;

    set({ queueIndex: prevIndex, isLoading: true, positionMillis: 0, durationMillis: 0, error: null });
    await loadAndPlay(track.uri, (status) => {
      const snapshot = get();
      if (snapshot.mode !== "verse") return;
      set(statusToState(status));
      if (status.isLoaded && status.didJustFinish) {
        get().next().catch(() => {});
      }
    });
  },

  seekTo: async (positionMillis: number) => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    await sound.setPositionAsync(Math.max(0, positionMillis));
  },
}));
