import type { Chapter } from "@/services/quranComApi";

function seedFromDate(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
}

// Small deterministic PRNG for a stable daily verse selection.
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickVerseKeyForDate(date: Date, chapters: Chapter[]) {
  if (!chapters.length) {
    throw new Error("Chapters list is empty.");
  }

  const rand = mulberry32(seedFromDate(date));
  const chapter = chapters[Math.floor(rand() * chapters.length)]!;
  const verseNumber = Math.max(1, Math.min(chapter.verses_count, 1 + Math.floor(rand() * chapter.verses_count)));

  return {
    verseKey: `${chapter.id}:${verseNumber}`,
    chapterId: chapter.id,
    chapterName: chapter.name_simple,
  };
}
