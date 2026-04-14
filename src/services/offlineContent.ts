import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import type { Verse } from "@/services/quranComApi";

const MANIFEST_KEY = "offline-manifest-v1";

const BASE_DIR = FileSystem.documentDirectory;
const ROOT_DIR = BASE_DIR ? `${BASE_DIR}offline/` : null;
const TEXT_DIR = ROOT_DIR ? `${ROOT_DIR}text/` : null;
const AUDIO_DIR = ROOT_DIR ? `${ROOT_DIR}audio/` : null;

function assertAvailable() {
  if (!ROOT_DIR || !TEXT_DIR || !AUDIO_DIR) {
    throw new Error("Offline downloads are not supported on this platform.");
  }
}

export type OfflineDownloadItem = {
  id: string;
  chapterId: number;
  translationId: number;
  recitationId: number;
  textPath?: string;
  audioPath?: string;
  createdAt: number;
  updatedAt: number;
};

type Manifest = {
  version: 1;
  items: OfflineDownloadItem[];
};

function makeId(chapterId: number, translationId: number, recitationId: number) {
  return `c${chapterId}-t${translationId}-r${recitationId}`;
}

async function ensureDirAsync(dir: string) {
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  } catch {
    // ignore (already exists)
  }
}

async function readManifest(): Promise<Manifest> {
  const raw = await AsyncStorage.getItem(MANIFEST_KEY);
  if (!raw) return { version: 1, items: [] };
  try {
    const parsed = JSON.parse(raw) as Manifest;
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) return { version: 1, items: [] };
    return parsed;
  } catch {
    return { version: 1, items: [] };
  }
}

async function writeManifest(manifest: Manifest) {
  await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
}

function getTextPath(chapterId: number, translationId: number) {
  assertAvailable();
  return `${TEXT_DIR}t${translationId}/c${chapterId}.json`;
}

function getAudioPath(chapterId: number, recitationId: number) {
  assertAvailable();
  return `${AUDIO_DIR}r${recitationId}/c${chapterId}.mp3`;
}

export async function isSurahDownloaded(opts: {
  chapterId: number;
  translationId: number;
  recitationId: number;
}): Promise<boolean> {
  if (!ROOT_DIR) return false;
  const { chapterId, translationId, recitationId } = opts;
  const manifest = await readManifest();
  const id = makeId(chapterId, translationId, recitationId);
  const item = manifest.items.find((i) => i.id === id);
  if (!item) return false;
  const hasText = item.textPath ? (await FileSystem.getInfoAsync(item.textPath)).exists : false;
  const hasAudio = item.audioPath ? (await FileSystem.getInfoAsync(item.audioPath)).exists : false;
  return hasText || hasAudio;
}

export async function downloadSurahText(opts: {
  chapterId: number;
  translationId: number;
  verses: Verse[];
}): Promise<string> {
  assertAvailable();
  const { chapterId, translationId, verses } = opts;
  await ensureDirAsync(TEXT_DIR!);
  await ensureDirAsync(`${TEXT_DIR!}t${translationId}/`);

  const path = getTextPath(chapterId, translationId);
  const payload = { chapterId, translationId, verses, savedAt: Date.now() };
  await FileSystem.writeAsStringAsync(path, JSON.stringify(payload), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return path;
}

export async function downloadChapterAudio(opts: {
  chapterId: number;
  recitationId: number;
  audioUrl: string;
}): Promise<string> {
  assertAvailable();
  const { chapterId, recitationId, audioUrl } = opts;
  await ensureDirAsync(AUDIO_DIR!);
  await ensureDirAsync(`${AUDIO_DIR!}r${recitationId}/`);

  const path = getAudioPath(chapterId, recitationId);
  await FileSystem.downloadAsync(audioUrl, path);
  return path;
}

export async function downloadSurahBundle(opts: {
  chapterId: number;
  translationId: number;
  recitationId: number;
  verses: Verse[];
  audioUrl?: string | null;
}): Promise<OfflineDownloadItem> {
  const { chapterId, translationId, recitationId, verses, audioUrl } = opts;
  const id = makeId(chapterId, translationId, recitationId);
  const now = Date.now();

  let textPath: string | undefined;
  let audioPath: string | undefined;

  textPath = await downloadSurahText({ chapterId, translationId, verses });
  if (audioUrl) {
    audioPath = await downloadChapterAudio({ chapterId, recitationId, audioUrl });
  }

  const manifest = await readManifest();
  const existingIndex = manifest.items.findIndex((i) => i.id === id);
  const item: OfflineDownloadItem = {
    id,
    chapterId,
    translationId,
    recitationId,
    textPath,
    audioPath,
    createdAt: existingIndex >= 0 ? manifest.items[existingIndex]!.createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    manifest.items[existingIndex] = item;
  } else {
    manifest.items.unshift(item);
  }
  await writeManifest(manifest);
  return item;
}

export async function listDownloads(): Promise<OfflineDownloadItem[]> {
  const manifest = await readManifest();
  return manifest.items;
}

export async function removeDownload(opts: {
  chapterId: number;
  translationId: number;
  recitationId: number;
}): Promise<void> {
  const { chapterId, translationId, recitationId } = opts;
  const id = makeId(chapterId, translationId, recitationId);
  const manifest = await readManifest();
  const item = manifest.items.find((i) => i.id === id);

  if (item?.textPath) {
    await FileSystem.deleteAsync(item.textPath, { idempotent: true }).catch(() => {});
  }
  if (item?.audioPath) {
    await FileSystem.deleteAsync(item.audioPath, { idempotent: true }).catch(() => {});
  }

  manifest.items = manifest.items.filter((i) => i.id !== id);
  await writeManifest(manifest);
}

export async function getOfflineSurahVerses(opts: {
  chapterId: number;
  translationId: number;
}): Promise<Verse[] | null> {
  if (!ROOT_DIR || !TEXT_DIR) return null;
  const { chapterId, translationId } = opts;
  const path = getTextPath(chapterId, translationId);
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;

  try {
    const raw = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
    const json = JSON.parse(raw) as { verses?: Verse[] };
    if (!json?.verses || !Array.isArray(json.verses)) return null;
    return json.verses;
  } catch {
    return null;
  }
}

export async function getOfflineChapterAudioPath(opts: {
  chapterId: number;
  recitationId: number;
}): Promise<string | null> {
  if (!ROOT_DIR || !AUDIO_DIR) return null;
  const { chapterId, recitationId } = opts;
  const path = getAudioPath(chapterId, recitationId);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists ? path : null;
}
