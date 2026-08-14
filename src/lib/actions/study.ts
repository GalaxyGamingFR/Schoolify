"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import { enforceRateLimit, aiGenerationLimiter, RateLimitError } from "@/lib/rate-limit";
import { extractDocumentText, extractWebsiteText, fetchYouTubeTitle, youTubeVideoId } from "@/lib/ai/extract";
import {
  generateStudyNotes,
  generateStudyQuiz,
  generateStudyFlashcards,
  generatePodcastScript,
  synthesizeSpeech,
  transcribeAudioUrl,
  transcribeYouTubeVideo,
  type SourceInput,
} from "@/lib/ai/study";
import type { StudySourceType } from "@prisma/client";

// Next.js redacts thrown Server Action errors in production -- only a
// generic digest crosses the client/server boundary, not the message, even
// for a plain `new Error("friendly text")`. Confirmed live: a real 429 quota
// error, thrown after being mapped to a clean message, still showed up
// client-side as "Minified React error #441" with the real text nowhere to
// be found. Returning a result object instead of throwing sidesteps that
// redaction entirely, since the message travels as ordinary data.
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

// Gemini's free tier has a real daily/per-minute quota -- once it's hit,
// the SDK's own retry logic exhausts itself and throws an AI_RetryError
// wrapping AI_APICallError with a 429/RESOURCE_EXHAUSTED body. Surfacing
// that raw message ("Resource has been exhausted (e.g. check quota)")
// isn't useful to a student, so this maps it to something that actually
// explains what happened.
function friendlyAiError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  if (/RESOURCE_EXHAUSTED|429|quota/i.test(message)) {
    return "Hit today's free AI usage limit — try again in a bit.";
  }
  return message || "Something went wrong";
}

async function requireOwner(studySetId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  const studySet = await prisma.studySet.findUnique({ where: { id: studySetId } });
  if (!studySet || studySet.ownerId !== user.id) throw new Error("Study set not found");
  return { user, studySet };
}

async function finishStudySet(studySetId: string, sources: SourceInput[]) {
  try {
    const notes = await generateStudyNotes(sources);
    await prisma.studySet.update({
      where: { id: studySetId },
      data: { notes, status: "READY" },
    });
  } catch (e) {
    await prisma.studySet.update({
      where: { id: studySetId },
      data: { status: "FAILED", error: friendlyAiError(e) },
    });
  }
}

async function createStudySet(
  user: { id: string },
  title: string,
  source: { type: StudySourceType; title: string; content?: string; url?: string },
) {
  const studySet = await prisma.studySet.create({
    data: {
      ownerId: user.id,
      title,
      status: "PROCESSING",
      sources: { create: [source] },
    },
  });
  return studySet;
}

export async function createStudySetFromText(input: { title: string; text: string }): Promise<ActionResult<string>> {
  const user = await getCurrentDbUser();
  if (!user) return { ok: false, error: "Not signed in" };
  try {
    await enforceRateLimit(aiGenerationLimiter, user.id);
  } catch (e) {
    return { ok: false, error: e instanceof RateLimitError ? e.message : "Rate limited" };
  }
  if (!input.text.trim()) return { ok: false, error: "Paste some text first" };

  const title = input.title.trim() || "Untitled study set";
  const studySet = await createStudySet(user, title, { type: "TEXT", title, content: input.text.trim() });

  await finishStudySet(studySet.id, [{ title, content: input.text.trim() }]);
  return { ok: true, data: studySet.id };
}

export async function createStudySetFromLink(url: string): Promise<ActionResult<string>> {
  const user = await getCurrentDbUser();
  if (!user) return { ok: false, error: "Not signed in" };
  try {
    await enforceRateLimit(aiGenerationLimiter, user.id);
  } catch (e) {
    return { ok: false, error: e instanceof RateLimitError ? e.message : "Rate limited" };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL" };
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return { ok: false, error: "URL must be http or https" };

  const videoId = youTubeVideoId(parsed.toString());
  let type: StudySourceType, title: string, content: string;
  try {
    if (videoId) {
      type = "YOUTUBE";
      title = await fetchYouTubeTitle(videoId);
      content = await transcribeYouTubeVideo(parsed.toString());
    } else {
      type = "WEBSITE";
      ({ title, content } = await extractWebsiteText(parsed.toString()));
    }
  } catch (e) {
    return { ok: false, error: friendlyAiError(e) };
  }

  const studySet = await createStudySet(user, title, { type, title, content, url: parsed.toString() });

  await finishStudySet(studySet.id, [{ title, content }]);
  return { ok: true, data: studySet.id };
}

export async function createStudySetFromDocument(input: {
  title: string;
  blobUrl: string;
  contentType: string;
}): Promise<ActionResult<string>> {
  const user = await getCurrentDbUser();
  if (!user) return { ok: false, error: "Not signed in" };
  try {
    await enforceRateLimit(aiGenerationLimiter, user.id);
  } catch (e) {
    return { ok: false, error: e instanceof RateLimitError ? e.message : "Rate limited" };
  }
  if (!new URL(input.blobUrl).hostname.endsWith(".public.blob.vercel-storage.com")) {
    return { ok: false, error: "Invalid file" };
  }

  const title = input.title.trim() || "Untitled study set";
  let content: string;
  try {
    content = await extractDocumentText(input.blobUrl, input.contentType);
  } catch (e) {
    return { ok: false, error: friendlyAiError(e) };
  }
  const studySet = await createStudySet(user, title, {
    type: "DOCUMENT",
    title,
    content,
    url: input.blobUrl,
  });

  await finishStudySet(studySet.id, [{ title, content }]);
  return { ok: true, data: studySet.id };
}

export async function createStudySetFromAudio(input: {
  title: string;
  blobUrl: string;
  contentType: string;
}): Promise<ActionResult<string>> {
  const user = await getCurrentDbUser();
  if (!user) return { ok: false, error: "Not signed in" };
  try {
    await enforceRateLimit(aiGenerationLimiter, user.id);
  } catch (e) {
    return { ok: false, error: e instanceof RateLimitError ? e.message : "Rate limited" };
  }
  if (!new URL(input.blobUrl).hostname.endsWith(".public.blob.vercel-storage.com")) {
    return { ok: false, error: "Invalid file" };
  }

  const title = input.title.trim() || "Untitled study set";
  let content: string;
  try {
    content = await transcribeAudioUrl(input.blobUrl, input.contentType);
  } catch (e) {
    return { ok: false, error: friendlyAiError(e) };
  }
  const studySet = await createStudySet(user, title, {
    type: "AUDIO",
    title,
    content,
    url: input.blobUrl,
  });

  await finishStudySet(studySet.id, [{ title, content }]);
  return { ok: true, data: studySet.id };
}

export async function getStudySetStatus(studySetId: string) {
  const { studySet } = await requireOwner(studySetId);
  return { status: studySet.status, error: studySet.error };
}

export async function updateStudyNotes(studySetId: string, notes: string) {
  const { studySet } = await requireOwner(studySetId);
  await prisma.studySet.update({ where: { id: studySet.id }, data: { notes } });
  revalidatePath(`/study/${studySetId}`);
}

export async function deleteStudySet(studySetId: string) {
  await requireOwner(studySetId);
  await prisma.studySet.delete({ where: { id: studySetId } });
  revalidatePath("/study");
}

export async function generateQuizForStudySet(studySetId: string): Promise<ActionResult<string>> {
  const { user, studySet } = await requireOwner(studySetId);
  try {
    await enforceRateLimit(aiGenerationLimiter, user.id);
  } catch (e) {
    return { ok: false, error: e instanceof RateLimitError ? e.message : "Rate limited" };
  }
  if (!studySet.notes) return { ok: false, error: "Generate notes first" };

  let generated: Awaited<ReturnType<typeof generateStudyQuiz>>;
  try {
    generated = await generateStudyQuiz(studySet.notes);
  } catch (e) {
    return { ok: false, error: friendlyAiError(e) };
  }

  const quiz = await prisma.studyQuiz.create({
    data: {
      studySetId,
      title: generated.title,
      questions: { create: generated.questions },
    },
  });

  revalidatePath(`/study/${studySetId}`);
  return { ok: true, data: quiz.id };
}

export async function generateFlashcardsForStudySet(studySetId: string): Promise<ActionResult<string>> {
  const { user, studySet } = await requireOwner(studySetId);
  try {
    await enforceRateLimit(aiGenerationLimiter, user.id);
  } catch (e) {
    return { ok: false, error: e instanceof RateLimitError ? e.message : "Rate limited" };
  }
  if (!studySet.notes) return { ok: false, error: "Generate notes first" };

  let generated: Awaited<ReturnType<typeof generateStudyFlashcards>>;
  try {
    generated = await generateStudyFlashcards(studySet.notes);
  } catch (e) {
    return { ok: false, error: friendlyAiError(e) };
  }

  const deck = await prisma.studyFlashcardDeck.create({
    data: {
      studySetId,
      title: generated.title,
      cards: { create: generated.cards },
    },
  });

  revalidatePath(`/study/${studySetId}`);
  return { ok: true, data: deck.id };
}

export async function generatePodcastForStudySet(studySetId: string): Promise<ActionResult<string>> {
  const { user, studySet } = await requireOwner(studySetId);
  try {
    await enforceRateLimit(aiGenerationLimiter, user.id);
  } catch (e) {
    return { ok: false, error: e instanceof RateLimitError ? e.message : "Rate limited" };
  }
  if (!studySet.notes) return { ok: false, error: "Generate notes first" };

  const podcast = await prisma.studyPodcast.create({
    data: { studySetId, title: `${studySet.title} — audio overview`, script: "", status: "PROCESSING" },
  });

  try {
    const script = await generatePodcastScript(studySet.notes);
    const { bytes, mediaType } = await synthesizeSpeech(script);
    const ext = mediaType.includes("wav") ? "wav" : "mp3";
    const blob = await put(`study-podcasts/${podcast.id}.${ext}`, Buffer.from(bytes), {
      access: "public",
      contentType: mediaType,
    });

    await prisma.studyPodcast.update({
      where: { id: podcast.id },
      data: { script, audioUrl: blob.url, status: "READY" },
    });
  } catch (e) {
    await prisma.studyPodcast.update({
      where: { id: podcast.id },
      data: { status: "FAILED", error: friendlyAiError(e) },
    });
  }

  revalidatePath(`/study/${studySetId}`);
  return { ok: true, data: podcast.id };
}
