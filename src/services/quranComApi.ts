import { z } from "zod";
import { stripHtmlTags } from "@/utils/html";

const API_BASE_URL = "https://api.quran.com/api/v4";
export const VERSE_AUDIO_BASE_URL = "https://verses.quran.com/";

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(API_BASE_URL + path);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function quranFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  { timeoutMs = 15000 }: { timeoutMs?: number } = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(buildUrl(path, params), {
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Quran.com API ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

const ChapterSchema = z.object({
  id: z.number(),
  revelation_place: z.string().nullable().optional(),
  revelation_order: z.number().nullable().optional(),
  bismillah_pre: z.boolean().optional(),
  name_simple: z.string(),
  name_complex: z.string().optional(),
  name_arabic: z.string(),
  verses_count: z.number(),
  translated_name: z
    .object({
      language_name: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
});

export type Chapter = z.infer<typeof ChapterSchema>;

const TranslationResourceSchema = z.object({
  id: z.number(),
  name: z.string(),
  author_name: z.string().nullable().optional(),
  language_name: z.string().nullable().optional(),
});

export type TranslationResource = z.infer<typeof TranslationResourceSchema>;

const RecitationResourceSchema = z.object({
  id: z.number(),
  reciter_name: z.string(),
  style: z.string().nullable().optional(),
});

export type RecitationResource = z.infer<typeof RecitationResourceSchema>;

const TafsirResourceSchema = z.object({
  id: z.number(),
  name: z.string(),
  language_name: z.string().nullable().optional(),
});

export type TafsirResource = z.infer<typeof TafsirResourceSchema>;

const VerseAudioSchema = z.object({
  url: z.string().nullable().optional(),
  segments: z.array(z.array(z.number())).optional(),
});

const VerseTranslationSchema = z.object({
  resource_id: z.number(),
  text: z.string(),
});

const VerseSchema = z.object({
  id: z.number(),
  verse_key: z.string(),
  verse_number: z.number(),
  text_uthmani: z.string().optional(),
  audio: VerseAudioSchema.optional(),
  translations: z.array(VerseTranslationSchema).optional(),
});

export type Verse = z.infer<typeof VerseSchema> & {
  translations?: Array<z.infer<typeof VerseTranslationSchema> & { textPlain: string }>;
};

function normalizeVerse(verse: z.infer<typeof VerseSchema>): Verse {
  return {
    ...verse,
    translations: verse.translations?.map((t) => ({
      ...t,
      textPlain: stripHtmlTags(t.text),
    })),
  };
}

export async function getChapters(language = "en"): Promise<Chapter[]> {
  const data = await quranFetch<{ chapters: unknown[] }>("/chapters", { language });
  return z.array(ChapterSchema).parse(data.chapters);
}

export async function getTranslations(language = "en"): Promise<TranslationResource[]> {
  const data = await quranFetch<{ translations: unknown[] }>("/resources/translations", { language });
  return z.array(TranslationResourceSchema).parse(data.translations);
}

export async function getRecitations(language = "en"): Promise<RecitationResource[]> {
  const data = await quranFetch<{ recitations: unknown[] }>("/resources/recitations", { language });
  return z.array(RecitationResourceSchema).parse(data.recitations);
}

export async function getTafsirs(language = "en"): Promise<TafsirResource[]> {
  const data = await quranFetch<{ tafsirs: unknown[] }>("/resources/tafsirs", { language });
  return z.array(TafsirResourceSchema).parse(data.tafsirs);
}

type VersesByChapterResponse = {
  verses: unknown[];
  // Quran.com currently returns `pagination`, but older examples used `meta`.
  pagination?: {
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records?: number;
    per_page?: number;
  };
  meta?: {
    current_page: number;
    next_page: number | null;
    total_pages: number;
  };
};

export async function getVersesByChapter(
  chapterId: number,
  {
    translationId,
    recitationId,
    page = 1,
    perPage = 50,
    language = "en",
  }: {
    translationId: number;
    recitationId?: number;
    page?: number;
    perPage?: number;
    language?: string;
  }
): Promise<{ verses: Verse[]; totalPages: number; page: number }> {
  const data = await quranFetch<VersesByChapterResponse>(`/verses/by_chapter/${chapterId}`, {
    language,
    fields: "text_uthmani",
    words: false,
    translations: translationId,
    audio: recitationId,
    page,
    per_page: perPage,
  });

  const pagination = data.pagination ?? data.meta;
  if (!pagination) {
    throw new Error("Unexpected Quran.com response: missing pagination info.");
  }

  const verses = z.array(VerseSchema).parse(data.verses).map(normalizeVerse);
  return { verses, totalPages: pagination.total_pages, page: pagination.current_page };
}

export async function getAllVersesByChapter(
  chapterId: number,
  options: { translationId: number; recitationId?: number; language?: string }
): Promise<Verse[]> {
  const first = await getVersesByChapter(chapterId, { ...options, page: 1, perPage: 50 });
  const all: Verse[] = [...first.verses];
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await getVersesByChapter(chapterId, { ...options, page, perPage: 50 });
    all.push(...next.verses);
  }
  return all;
}

const VerseByKeySchema = z.object({
  verse: VerseSchema,
});

export async function getVerseByKey(
  verseKey: string,
  { translationId, recitationId, language = "en" }: { translationId: number; recitationId?: number; language?: string }
): Promise<Verse> {
  const data = await quranFetch<unknown>(`/verses/by_key/${encodeURIComponent(verseKey)}`, {
    language,
    fields: "text_uthmani",
    words: false,
    translations: translationId,
    audio: recitationId,
  });
  const parsed = VerseByKeySchema.parse(data);
  return normalizeVerse(parsed.verse);
}

export function getVerseAudioUrl(audioUrl: string): string {
  if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) return audioUrl;
  return new URL(audioUrl, VERSE_AUDIO_BASE_URL).toString();
}

const ChapterAudioSchema = z.object({
  audio_file: z.object({
    audio_url: z.string(),
    file_size: z.number().nullable().optional(),
    format: z.string().nullable().optional(),
  }),
});

export type ChapterAudio = z.infer<typeof ChapterAudioSchema>["audio_file"];

export async function getChapterAudio(recitationId: number, chapterId: number): Promise<ChapterAudio> {
  const data = await quranFetch<unknown>(`/chapter_recitations/${recitationId}/${chapterId}`);
  return ChapterAudioSchema.parse(data).audio_file;
}

const SearchResultSchema = z.object({
  verse_key: z.string(),
  verse_id: z.number(),
  text: z.string(),
  translations: z
    .array(
      z.object({
        resource_id: z.number(),
        text: z.string(),
        name: z.string().optional(),
        language_name: z.string().optional(),
      })
    )
    .optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema> & {
  textPlain: string;
  translationPlain?: string;
};

const SearchResponseSchema = z.object({
  search: z.object({
    query: z.string().optional(),
    total_results: z.number().optional(),
    current_page: z.number().optional(),
    total_pages: z.number().optional(),
    per_page: z.number().optional(),
    results: z.array(SearchResultSchema),
  }),
});

export async function search(
  query: string,
  {
    translationId,
    language = "en",
    page = 1,
    size = 20,
  }: {
    translationId: number;
    language?: string;
    page?: number;
    size?: number;
  }
): Promise<{
  results: SearchResult[];
  totalPages: number;
  totalResults: number;
  page: number;
}> {
  const data = await quranFetch<unknown>("/search", {
    q: query,
    page,
    size,
    language,
    translations: translationId,
  });

  const parsed = SearchResponseSchema.parse(data).search;
  return {
    results: parsed.results.map((r) => ({
      ...r,
      textPlain: stripHtmlTags(r.text),
      translationPlain: r.translations?.[0]?.text ? stripHtmlTags(r.translations[0].text) : undefined,
    })),
    totalPages: parsed.total_pages ?? 1,
    totalResults: parsed.total_results ?? parsed.results.length,
    page: parsed.current_page ?? page,
  };
}

const TafsirByAyahSchema = z.object({
  tafsir: z.object({
    text: z.string(),
  }),
});

export async function getTafsirByAyah(tafsirId: number, verseId: number): Promise<{ html: string; plain: string }> {
  const data = await quranFetch<unknown>(`/tafsirs/${tafsirId}/by_ayah/${verseId}`);
  const html = TafsirByAyahSchema.parse(data).tafsir.text;
  return { html, plain: stripHtmlTags(html) };
}
