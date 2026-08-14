import "server-only";
import { generateText, generateSpeech, transcribe, gateway, Output } from "ai";
import { z } from "zod";

const TEXT_MODEL = "anthropic/claude-sonnet-5";

export type SourceInput = { title: string; content: string };

function materialBlock(sources: SourceInput[]) {
  return sources.map((s) => `### ${s.title}\n${s.content}`).join("\n\n---\n\n");
}

export async function generateStudyNotes(sources: SourceInput[]): Promise<string> {
  const { text } = await generateText({
    model: TEXT_MODEL,
    system:
      "You turn source material into clear, well-organized study notes in markdown: " +
      "headings, bullet points, **bolded** key terms and definitions. Be faithful to the " +
      "source material -- never invent facts that aren't in it. Comprehensive but skimmable.",
    prompt: `Generate study notes from this material:\n\n${materialBlock(sources)}`,
  });
  return text;
}

const quizSchema = z.object({
  title: z.string(),
  questions: z
    .array(
      z.object({
        question: z.string(),
        choices: z.array(z.string()).length(4),
        correctIndex: z.number().int().min(0).max(3),
        explanation: z.string(),
      }),
    )
    .min(5)
    .max(10),
});

export type GeneratedQuiz = z.infer<typeof quizSchema>;

export async function generateStudyQuiz(notes: string): Promise<GeneratedQuiz> {
  const { output } = await generateText({
    model: TEXT_MODEL,
    output: Output.object({ schema: quizSchema }),
    prompt: `Generate a multiple-choice quiz (5-10 questions, 4 choices each, one correct) testing understanding of these study notes:\n\n${notes}`,
  });
  return output;
}

const flashcardsSchema = z.object({
  title: z.string(),
  cards: z
    .array(z.object({ front: z.string(), back: z.string() }))
    .min(8)
    .max(20),
});

export type GeneratedFlashcards = z.infer<typeof flashcardsSchema>;

export async function generateStudyFlashcards(notes: string): Promise<GeneratedFlashcards> {
  const { output } = await generateText({
    model: TEXT_MODEL,
    output: Output.object({ schema: flashcardsSchema }),
    prompt: `Generate flashcards (8-20 cards) covering the key terms and concepts in these study notes. Front = term or short question, back = a concise answer:\n\n${notes}`,
  });
  return output;
}

export async function generatePodcastScript(notes: string): Promise<string> {
  const { text } = await generateText({
    model: TEXT_MODEL,
    system:
      "You write natural spoken-word scripts for a single narrator reading a friendly audio " +
      "summary of study material aloud. Conversational tone, plain prose only -- no markdown, " +
      "no headers, no bullet points, nothing that isn't meant to be spoken.",
    prompt: `Write a 2-4 minute spoken audio-overview script covering these study notes:\n\n${notes}`,
  });
  return text;
}

export async function transcribeAudioUrl(url: string): Promise<string> {
  const result = await transcribe({
    model: gateway.transcriptionModel("openai/whisper-1"),
    audio: new URL(url),
  });
  return result.text;
}

export async function synthesizeSpeech(text: string): Promise<{ bytes: Uint8Array; mediaType: string }> {
  const result = await generateSpeech({
    model: gateway.speechModel("openai/tts-1"),
    text,
    voice: "alloy",
  });
  return { bytes: result.audio.uint8Array, mediaType: result.audio.mediaType };
}
