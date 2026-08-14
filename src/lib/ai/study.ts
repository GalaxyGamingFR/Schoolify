import "server-only";
import { generateText, generateSpeech, Output, type ModelMessage, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

// Direct Google Gemini, not the Vercel AI Gateway -- Gemini has a genuinely
// free tier with no credit card required, unlike the Gateway which refuses
// to serve any request until a card is on file. Reads GEMINI_API_KEY
// (from https://aistudio.google.com/apikey) rather than the package's
// default GOOGLE_GENERATIVE_AI_API_KEY, matching what's already in .env.
export const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

// None of this app's generation tasks (reformatting notes, writing a quiz
// from them, answering a question grounded in them) need Gemini's "thinking"
// mode -- leaving it on burned ~80 reasoning tokens and ~90s on a two-word
// reply in testing.
export const NO_THINKING = { google: { thinkingConfig: { thinkingBudget: 0 } } };

// Free-tier Gemini models occasionally return 503 "high demand"/UNAVAILABLE
// or 429 RESOURCE_EXHAUSTED even after the SDK's own 3 retries against the
// SAME model -- confirmed live for both gemini-3.7-flash and gemini-3.5-flash
// in testing. Different models draw from mostly-independent capacity, so
// falling through this chain on a retryable error is far more reliable than
// retrying the same overloaded model again.
const TEXT_MODEL = google("gemini-3.5-flash");
const MODEL_CHAIN = [TEXT_MODEL, google("gemini-3.1-flash-lite-preview"), google("gemini-3-flash-preview")];

function isRetryableModelError(e: unknown): boolean {
  const message = e instanceof Error ? e.message : String(e);
  return /RESOURCE_EXHAUSTED|UNAVAILABLE|high demand|status(Code)?["\s:]*(429|503)/i.test(message);
}

// Takes a callback rather than a pre-built options object -- trying to type
// "generateText's options minus model" directly (via Omit) collapses its
// discriminated prompt/messages union and breaks call-site type checking.
// A callback lets each call site's object literal be checked directly
// against generateText's real (overloaded) signature.
async function generateTextResilient<T>(makeCall: (model: LanguageModel) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (const model of MODEL_CHAIN) {
    try {
      return await makeCall(model);
    } catch (e) {
      lastError = e;
      if (!isRetryableModelError(e)) throw e;
    }
  }
  throw lastError;
}

export type SourceInput = { title: string; content: string };

function materialBlock(sources: SourceInput[]) {
  return sources.map((s) => `### ${s.title}\n${s.content}`).join("\n\n---\n\n");
}

export async function generateStudyNotes(sources: SourceInput[]): Promise<string> {
  const { text } = await generateTextResilient((model) =>
    generateText({
      model,
      maxRetries: 1,
      providerOptions: NO_THINKING,
      system:
        "You turn source material into clear, well-organized study notes in markdown: " +
        "headings, bullet points, **bolded** key terms and definitions. Be faithful to the " +
        "source material -- never invent facts that aren't in it. Comprehensive but skimmable.",
      prompt: `Generate study notes from this material:\n\n${materialBlock(sources)}`,
    }),
  );
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
  const { output } = await generateTextResilient((model) =>
    generateText({
      model,
      maxRetries: 1,
      providerOptions: NO_THINKING,
      output: Output.object({ schema: quizSchema }),
      prompt: `Generate a multiple-choice quiz (5-10 questions, 4 choices each, one correct) testing understanding of these study notes:\n\n${notes}`,
    }),
  );
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
  const { output } = await generateTextResilient((model) =>
    generateText({
      model,
      maxRetries: 1,
      providerOptions: NO_THINKING,
      output: Output.object({ schema: flashcardsSchema }),
      prompt: `Generate flashcards (8-20 cards) covering the key terms and concepts in these study notes. Front = term or short question, back = a concise answer:\n\n${notes}`,
    }),
  );
  return output;
}

export async function generatePodcastScript(notes: string): Promise<string> {
  const { text } = await generateTextResilient((model) =>
    generateText({
      model,
      maxRetries: 1,
      providerOptions: NO_THINKING,
      system:
        "You write natural spoken-word scripts for a single narrator reading a friendly audio " +
        "summary of study material aloud. Conversational tone, plain prose only -- no markdown, " +
        "no headers, no bullet points, nothing that isn't meant to be spoken.",
      prompt: `Write a 2-4 minute spoken audio-overview script covering these study notes:\n\n${notes}`,
    }),
  );
  return text;
}

export async function generateChatReply(system: string, messages: ModelMessage[]): Promise<string> {
  const { text } = await generateTextResilient((model) =>
    generateText({ model, maxRetries: 1, providerOptions: NO_THINKING, system, messages }),
  );
  return text;
}

// Gemini has no separate "transcription model" endpoint like Whisper --
// audio is just another input to the language model, so this asks it
// directly for a verbatim transcript instead of calling a dedicated API.
export async function transcribeAudioUrl(url: string, mediaType: string): Promise<string> {
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: [
        { type: "text", text: "Transcribe this audio verbatim. Return only the transcript, no commentary." },
        { type: "file", data: new URL(url), mediaType },
      ],
    },
  ];
  const { text } = await generateTextResilient((model) => generateText({ model, maxRetries: 1, providerOptions: NO_THINKING, messages }));
  return text;
}

// Gemini can watch a public YouTube video directly given just its URL (free
// tier: up to 8 hours of video/day, public videos only) -- this replaced an
// earlier approach that scraped YouTube's caption-track endpoint directly,
// which started silently returning empty responses once YouTube's anti-bot
// protection kicked in. Video processing genuinely takes 30-90s on Gemini's
// end regardless of thinking mode, so this one call is just slow.
export async function transcribeYouTubeVideo(url: string): Promise<string> {
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Transcribe this video verbatim as best you can. If exact transcription isn't possible, give a thorough, detailed summary of everything said and shown instead. Return only the transcript/summary, no commentary.",
        },
        { type: "file", data: new URL(url), mediaType: "video/mp4" },
      ],
    },
  ];
  const { text } = await generateTextResilient((model) => generateText({ model, maxRetries: 1, providerOptions: NO_THINKING, messages }));
  return text;
}

export async function synthesizeSpeech(text: string): Promise<{ bytes: Uint8Array; mediaType: string }> {
  const result = await generateSpeech({
    model: google.speech("gemini-3.1-flash-tts-preview"),
    text,
    voice: "Kore",
  });
  return { bytes: result.audio.uint8Array, mediaType: result.audio.mediaType };
}
