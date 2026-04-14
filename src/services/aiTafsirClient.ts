import { z } from "zod";

const AiResponseSchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()).optional(),
});

export type AiTafsirResponse = z.infer<typeof AiResponseSchema>;

export function isAiTafsirConfigured() {
  return !!process.env.EXPO_PUBLIC_AI_TAFSIR_URL;
}

export async function fetchAiTafsir(opts: {
  verseKey: string;
  arabicText: string;
  translationText: string;
  tafsirText: string;
}): Promise<AiTafsirResponse> {
  const url = process.env.EXPO_PUBLIC_AI_TAFSIR_URL;
  if (!url) {
    throw new Error("AI tafsir is not configured. Set EXPO_PUBLIC_AI_TAFSIR_URL.");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(opts),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI server error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  // Genkit Express returns `{ result: <flowOutput> }` for non-streaming flows.
  const payload = typeof json === "object" && json && "result" in json ? (json as any).result : json;
  return AiResponseSchema.parse(payload);
}
