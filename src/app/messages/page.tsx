import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Messages",
  description: "Your conversations and class chats.",
};

export default async function MessagesPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const [participations, courseChats] = await Promise.all([
    prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { select: { id: true, name: true } } } },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    }),
    prisma.course.findMany({
      where: {
        OR: [{ teacherId: user.id }, { enrollments: { some: { studentId: user.id } } }],
        conversation: { isNot: null },
      },
      include: { conversation: { include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } } },
    }),
  ]);

  const directAndGroup = participations
    .map((p) => {
      const c = p.conversation;
      const lastMessage = c.messages[0];
      const otherParticipants = c.participants.filter((pp) => pp.userId !== user.id);
      const title =
        c.type === "GROUP" ? c.name : otherParticipants.map((pp) => pp.user.name).join(", ") || "Just you";
      const unread = !!lastMessage && (!p.lastReadAt || lastMessage.createdAt > p.lastReadAt);
      return { id: c.id, title, lastMessage, unread, sortAt: lastMessage?.createdAt ?? c.createdAt };
    })
    .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime());

  const courseConversations = courseChats
    .map((c) => ({
      id: c.conversation!.id,
      title: `${c.name} — Class chat`,
      lastMessage: c.conversation!.messages[0],
      sortAt: c.conversation!.messages[0]?.createdAt ?? c.conversation!.createdAt,
    }))
    .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime());

  const all = [
    ...directAndGroup.map((c) => ({ ...c, isCourse: false })),
    ...courseConversations.map((c) => ({ ...c, isCourse: true, unread: false })),
  ].sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime());

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <Button
            size="sm"
            render={
              <Link href="/messages/new">
                <MessageSquarePlus className="size-4" /> New
              </Link>
            }
          />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          You can only message classmates or your teacher — not open to anyone platform-wide.
        </p>

        <div className="mt-6 space-y-2">
          {all.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No conversations yet. Start one, or open a class chat from a course page.
            </p>
          ) : (
            all.map((c) => (
              <Link key={c.id} href={`/messages/${c.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between gap-2 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {c.isCourse && <Users className="size-3.5 text-muted-foreground" />}
                        {c.title}
                        {c.unread && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.lastMessage ? c.lastMessage.body : "No messages yet"}
                      </p>
                    </div>
                    {c.lastMessage && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(c.lastMessage.createdAt, { addSuffix: true })}
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
