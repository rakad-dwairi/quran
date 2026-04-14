import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const ai = genkit({
  plugins: [googleAI()],
});

export const AiTafsirInputSchema = z.object({
  verseKey: z.string(),
  arabicText: z.string(),
  translationText: z.string(),
  tafsirText: z.string(),
});

export const AiTafsirOutputSchema = z.object({
  summary: z.string().describe("A simplified explanation of the verse based on the provided tafsir."),
  keyPoints: z.array(z.string()).describe("3–7 concise bullet points."),
});

export const aiTafsirFlow = ai.defineFlow(
  {
    name: "aiTafsirFlow",
    inputSchema: AiTafsirInputSchema,
    outputSchema: AiTafsirOutputSchema,
  },
  async (input) => {
    const prompt = `You are a helpful assistant for Quran study.

Task:
- Provide a simplified explanation of the verse, grounded ONLY in the given tafsir text.
- Provide 3–7 concise key points.

Rules:
- Do NOT invent facts or add claims not supported by the tafsir text.
- If the tafsir text is unclear or missing details, say so.
- Avoid issuing legal rulings (fatwa). Use neutral, respectful language.
- Output MUST match the provided JSON schema.

Verse key: ${input.verseKey}

Arabic:
${input.arabicText}

Translation:
${input.translationText}

Tafsir (source excerpt):
${input.tafsirText}`;

    const { output } = await ai.generate({
      model: googleAI.model(modelName),
      prompt,
      output: { schema: AiTafsirOutputSchema },
    });

    if (!output) {
      throw new Error("Failed to generate AI tafsir output.");
    }

    return output;
  }
);

