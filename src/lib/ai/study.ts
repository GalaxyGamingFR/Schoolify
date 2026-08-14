import "server-only";
import { generateText, generateSpeech, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

// Direct Google Gemini, not the Vercel AI Gateway -- Gemini has a genuinely
// free tier with no credit card required, unlike the Gateway which refuses
// to serve any request until a card is on file. Reads GEMINI_API_KEY
// (from https://aistudio.google.com/apikey) rather than the package's
// default GOOGLE_GENERATIVE_AI_API_KEY, matching what's already in .env.
export const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
// gemini-3.7-flash hit "high demand" capacity errors in testing (new enough
// that free-tier headroom is thin); gemini-2.5-flash is no longer available
// to new API keys at all ("no longer available to new users"). 3.5-flash
// split the difference in testing -- established, fast, actually available.
export const TEXT_MODEL = google("gemini-3.5-flash");

// None of this app's generation tasks (reformatting notes, writing a quiz
// from them, answering a question grounded in them) need Gemini's "thinking"
// mode -- leaving it on burned ~80 reasoning tokens and ~90s on a two-word
// reply in testing. Exported so the chat route (which builds its own
// providerOptions for streamText) can reuse the same setting.
export const NO_THINKING = { google: { thinkingConfig: { thinkingBudget: 0 } } };

export type SourceInput = { title: string; content: string };

function materialBlock(sources: SourceInput[]) {
  return sources.map((s) => `### ${s.title}\n${s.content}`).join("\n\n---\n\n");
}

export async function generateStudyNotes(sources: SourceInput[]): Promise<string> {
  const { text } = await generateText({
    model: TEXT_MODEL,
    providerOptions: NO_THINKING,
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
    providerOptions: NO_THINKING,
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
    providerOptions: NO_THINKING,
    output: Output.object({ schema: flashcardsSchema }),
    prompt: `Generate flashcards (8-20 cards) covering the key terms and concepts in these study notes. Front = term or short question, back = a concise answer:\n\n${notes}`,
  });
  return output;
}

export async function generatePodcastScript(notes: string): Promise<string> {
  const { text } = await generateText({
    model: TEXT_MODEL,
    providerOptions: NO_THINKING,
    system:
      "You write natural spoken-word scripts for a single narrator reading a friendly audio " +
      "summary of study material aloud. Conversational tone, plain prose only -- no markdown, " +
      "no headers, no bullet points, nothing that isn't meant to be spoken.",
    prompt: `Write a 2-4 minute spoken audio-overview script covering these study notes:\n\n${notes}`,
  });
  return text;
}

// Gemini has no separate "transcription model" endpoint like Whisper --
// audio is just another input to the language model, so this asks it
// directly for a verbatim transcript instead of calling a dedicated API.
export async function transcribeAudioUrl(url: string, mediaType: string): Promise<string> {
  const { text } = await generateText({
    model: TEXT_MODEL,
    providerOptions: NO_THINKING,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Transcribe this audio verbatim. Return only the transcript, no commentary." },
          { type: "file", data: new URL(url), mediaType },
        ],
      },
    ],
  });
  return text;
}

// Gemini can watch a public YouTube video directly given just its URL (free
// tier: up to 8 hours of video/day, public videos only) -- this replaced an
// earlier approach that scraped YouTube's caption-track endpoint directly,
// which started silently returning empty responses once YouTube's anti-bot
// protection kicked in. Video processing genuinely takes 30-90s on Gemini's
// end regardless of thinking mode, so this one call is just slow.
export async function transcribeYouTubeVideo(url: string): Promise<string> {
  const { text } = await generateText({
    model: TEXT_MODEL,
    providerOptions: NO_THINKING,
    messages: [
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
    ],
  });
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
