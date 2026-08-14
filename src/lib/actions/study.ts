"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import { enforceRateLimit, aiGenerationLimiter } from "@/lib/rate-limit";
import { extractDocumentText, extractWebsiteText, extractYouTubeTranscript, youTubeVideoId } from "@/lib/ai/extract";
import {
  generateStudyNotes,
  generateStudyQuiz,
  generateStudyFlashcards,
  generatePodcastScript,
  synthesizeSpeech,
  transcribeAudioUrl,
  type SourceInput,
} from "@/lib/ai/study";
import type { StudySourceType } from "@prisma/client";

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
      data: { status: "FAILED", error: e instanceof Error ? e.message : "Generation failed" },
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

export async function createStudySetFromText(input: { title: string; text: string }) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  await enforceRateLimit(aiGenerationLimiter, user.id);
  if (!input.text.trim()) throw new Error("Paste some text first");

  const title = input.title.trim() || "Untitled study set";
  const studySet = await createStudySet(user, title, {
    type: "TEXT",
    title,
    content: input.text.trim(),
  });

  await finishStudySet(studySet.id, [{ title, content: input.text.trim() }]);
  return studySet.id;
}

export async function createStudySetFromLink(url: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  await enforceRateLimit(aiGenerationLimiter, user.id);

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("That doesn't look like a valid URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("URL must be http or https");

  const videoId = youTubeVideoId(parsed.toString());
  const { type, title, content } = videoId
    ? { type: "YOUTUBE" as const, ...(await extractYouTubeTranscript(videoId)) }
    : { type: "WEBSITE" as const, ...(await extractWebsiteText(parsed.toString())) };

  const studySet = await createStudySet(user, title, { type, title, content, url: parsed.toString() });

  await finishStudySet(studySet.id, [{ title, content }]);
  return studySet.id;
}

export async function createStudySetFromDocument(input: { title: string; blobUrl: string; contentType: string }) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  await enforceRateLimit(aiGenerationLimiter, user.id);
  if (!new URL(input.blobUrl).hostname.endsWith(".public.blob.vercel-storage.com")) {
    throw new Error("Invalid file");
  }

  const title = input.title.trim() || "Untitled study set";
  const content = await extractDocumentText(input.blobUrl, input.contentType);
  const studySet = await createStudySet(user, title, {
    type: "DOCUMENT",
    title,
    content,
    url: input.blobUrl,
  });

  await finishStudySet(studySet.id, [{ title, content }]);
  return studySet.id;
}

export async function createStudySetFromAudio(input: { title: string; blobUrl: string }) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  await enforceRateLimit(aiGenerationLimiter, user.id);
  if (!new URL(input.blobUrl).hostname.endsWith(".public.blob.vercel-storage.com")) {
    throw new Error("Invalid file");
  }

  const title = input.title.trim() || "Untitled study set";
  const content = await transcribeAudioUrl(input.blobUrl);
  const studySet = await createStudySet(user, title, {
    type: "AUDIO",
    title,
    content,
    url: input.blobUrl,
  });

  await finishStudySet(studySet.id, [{ title, content }]);
  return studySet.id;
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

export async function generateQuizForStudySet(studySetId: string) {
  const { user, studySet } = await requireOwner(studySetId);
  await enforceRateLimit(aiGenerationLimiter, user.id);
  if (!studySet.notes) throw new Error("Generate notes first");

  const generated = await generateStudyQuiz(studySet.notes);
  const quiz = await prisma.studyQuiz.create({
    data: {
      studySetId,
      title: generated.title,
      questions: { create: generated.questions },
    },
  });

  revalidatePath(`/study/${studySetId}`);
  return quiz.id;
}

export async function generateFlashcardsForStudySet(studySetId: string) {
  const { user, studySet } = await requireOwner(studySetId);
  await enforceRateLimit(aiGenerationLimiter, user.id);
  if (!studySet.notes) throw new Error("Generate notes first");

  const generated = await generateStudyFlashcards(studySet.notes);
  const deck = await prisma.studyFlashcardDeck.create({
    data: {
      studySetId,
      title: generated.title,
      cards: { create: generated.cards },
    },
  });

  revalidatePath(`/study/${studySetId}`);
  return deck.id;
}

export async function generatePodcastForStudySet(studySetId: string) {
  const { user, studySet } = await requireOwner(studySetId);
  await enforceRateLimit(aiGenerationLimiter, user.id);
  if (!studySet.notes) throw new Error("Generate notes first");

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
      data: { status: "FAILED", error: e instanceof Error ? e.message : "Generation failed" },
    });
  }

  revalidatePath(`/study/${studySetId}`);
  return podcast.id;
}
