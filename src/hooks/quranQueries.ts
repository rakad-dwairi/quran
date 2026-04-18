import { useQuery } from "@tanstack/react-query";
import {
  getAllVersesByChapter,
  getChapterAudio,
  getChapters,
  getRecitations,
  getTafsirByAyah,
  getTafsirs,
  getTranslations,
  getVerseByKey,
  search as searchApi,
} from "@/services/quranComApi";

export function useChaptersQuery({ language = "en" }: { language?: string } = {}) {
  return useQuery({
    queryKey: ["chapters", language],
    queryFn: () => getChapters(language),
  });
}

export function useTranslationsQuery({ language = "en" }: { language?: string } = {}) {
  return useQuery({
    queryKey: ["translations", language],
    queryFn: () => getTranslations(language),
  });
}

export function useRecitationsQuery({ language = "en" }: { language?: string } = {}) {
  return useQuery({
    queryKey: ["recitations", language],
    queryFn: () => getRecitations(language),
  });
}

export function useTafsirsQuery({ language = "en" }: { language?: string } = {}) {
  return useQuery({
    queryKey: ["tafsirs", language],
    queryFn: () => getTafsirs(language),
  });
}

export function useChapterVersesQuery({
  chapterId,
  translationId,
  recitationId,
  language = "en",
  includeTransliteration = false,
}: {
  chapterId: number;
  translationId?: number | null;
  recitationId?: number;
  language?: string;
  includeTransliteration?: boolean;
}) {
  return useQuery({
    queryKey: ["versesByChapter", chapterId, translationId, recitationId, language, includeTransliteration],
    queryFn: () =>
      getAllVersesByChapter(chapterId, { translationId, recitationId, language, includeTransliteration }),
    enabled: Number.isFinite(chapterId) && chapterId > 0,
  });
}

export function useVerseByKeyQuery({
  verseKey,
  translationId,
  recitationId,
  language = "en",
  includeTransliteration = false,
  enabled,
}: {
  verseKey: string;
  translationId?: number | null;
  recitationId?: number;
  language?: string;
  includeTransliteration?: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["verseByKey", verseKey, translationId, recitationId, language, includeTransliteration],
    queryFn: () => getVerseByKey(verseKey, { translationId, recitationId, language, includeTransliteration }),
    enabled: enabled ?? !!verseKey,
  });
}

export function useChapterAudioQuery({
  chapterId,
  recitationId,
}: {
  chapterId: number;
  recitationId: number;
}) {
  return useQuery({
    queryKey: ["chapterAudio", chapterId, recitationId],
    queryFn: () => getChapterAudio(recitationId, chapterId),
    enabled: Number.isFinite(chapterId) && chapterId > 0 && Number.isFinite(recitationId) && recitationId > 0,
  });
}

export function useSearchQuery({
  query,
  translationId,
  page = 1,
  size = 20,
  language = "en",
  enabled,
}: {
  query: string;
  translationId: number;
  page?: number;
  size?: number;
  language?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["search", query, translationId, page, size, language],
    queryFn: () => searchApi(query, { translationId, page, size, language }),
    enabled: enabled ?? query.trim().length > 0,
  });
}

export function useTafsirQuery({
  tafsirId,
  verseId,
}: {
  tafsirId: number;
  verseId: number;
}) {
  return useQuery({
    queryKey: ["tafsir", tafsirId, verseId],
    queryFn: () => getTafsirByAyah(tafsirId, verseId),
    enabled: Number.isFinite(tafsirId) && tafsirId > 0 && Number.isFinite(verseId) && verseId > 0,
  });
}
