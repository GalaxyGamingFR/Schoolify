import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getMessagesSince, markConversationRead } from "@/lib/actions/messaging";
import { AppNav } from "@/components/app-nav";
import { MessageThread } from "@/components/message-thread";
import { ArrowLeft } from "lucide-react";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const { conversationId } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      course: true,
      participants: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!conversation) notFound();

  let title: string;
  let otherUserId: string | null = null;

  if (conversation.type === "COURSE") {
    if (!conversation.course) notFound();
    const hasAccess =
      conversation.course.teacherId === user.id ||
      (await prisma.enrollment.findFirst({ where: { courseId: conversation.course.id, studentId: user.id } })) !== null;
    if (!hasAccess) notFound();
    title = `${conversation.course.name} — Class chat`;
  } else {
    const isParticipant = conversation.participants.some((p) => p.userId === user.id);
    if (!isParticipant) notFound();
    const others = conversation.participants.filter((p) => p.userId !== user.id);
    title = conversation.type === "GROUP" ? conversation.name ?? "Group chat" : others[0]?.user.name ?? "Conversation";
    if (conversation.type === "DIRECT") otherUserId = others[0]?.userId ?? null;
  }

  await markConversationRead(conversationId);
  const initialMessages = await getMessagesSince(conversationId, null);

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
        <Link href="/messages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Messages
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{title}</h1>

        <MessageThread
          conversationId={conversationId}
          currentUserId={user.id}
          otherUserId={otherUserId}
          initialMessages={initialMessages.map((m) => ({
            id: m.id,
            body: m.body,
            senderId: m.senderId,
            senderName: m.sender.name,
            createdAt: m.createdAt.toISOString(),
          }))}
        />
      </main>
    </div>
  );
}
