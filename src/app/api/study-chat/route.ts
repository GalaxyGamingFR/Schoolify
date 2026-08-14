import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import { generateChatReply } from "@/lib/ai/study";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, aiGenerationLimiter } from "@/lib/rate-limit";

function friendlyChatError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  if (/RESOURCE_EXHAUSTED|UNAVAILABLE|high demand|429|503/i.test(message)) {
    return "Gemini is overloaded right now — try sending that again in a moment.";
  }
  return "Something went wrong — try sending that again.";
}

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { messages, studySetId }: { messages: UIMessage[]; studySetId: string } = await request.json();

  const studySet = await prisma.studySet.findUnique({ where: { id: studySetId } });
  if (!studySet || studySet.ownerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await enforceRateLimit(aiGenerationLimiter, user.id);
  } catch {
    return NextResponse.json({ error: "You're doing that too much — try again in a moment." }, { status: 429 });
  }

  const lastUserText = messages
    .at(-1)
    ?.parts?.filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  if (lastUserText) {
    await prisma.studyChatMessage.create({ data: { studySetId, role: "user", body: lastUserText } });
  }

  // Not streamText -- errors from an overloaded/unavailable model surface
  // mid-stream, after the response has already started, which is too late
  // to fall back to a different model. Non-streaming lets generateChatReply
  // fall through its model chain (same approach as notes/quiz/flashcards)
  // *before* anything is sent to the client, at the cost of the reply
  // arriving all at once instead of token-by-token.
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const modelMessages = await convertToModelMessages(messages);
      const system =
        "You are a study assistant helping a student understand their own notes below. " +
        "Answer questions clearly and concisely, grounded in these notes. If something isn't " +
        "covered by the notes, say so rather than guessing.\n\n" +
        (studySet.notes ?? "(no notes yet)");

      const text = await generateChatReply(system, modelMessages);

      const id = crypto.randomUUID();
      writer.write({ type: "text-start", id });
      writer.write({ type: "text-delta", id, delta: text });
      writer.write({ type: "text-end", id });

      if (text) await prisma.studyChatMessage.create({ data: { studySetId, role: "assistant", body: text } });
    },
    onError: (error) => {
      console.error("[study-chat] error:", error);
      return friendlyChatError(error);
    },
  });

  return createUIMessageStreamResponse({ stream });
}
