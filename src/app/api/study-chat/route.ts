import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, aiGenerationLimiter } from "@/lib/rate-limit";

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

  const result = streamText({
    model: "anthropic/claude-sonnet-5",
    system:
      "You are a study assistant helping a student understand their own notes below. " +
      "Answer questions clearly and concisely, grounded in these notes. If something isn't " +
      "covered by the notes, say so rather than guessing.\n\n" +
      (studySet.notes ?? "(no notes yet)"),
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      if (text) await prisma.studyChatMessage.create({ data: { studySetId, role: "assistant", body: text } });
    },
  });

  return result.toUIMessageStreamResponse();
}
