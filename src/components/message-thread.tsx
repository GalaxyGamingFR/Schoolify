"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { blockUser, getMessagesSince, reportMessage, sendMessage } from "@/lib/actions/messaging";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flag, Send, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 4000;

type ThreadMessage = {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  createdAt: string;
};

export function MessageThread({
  conversationId,
  currentUserId,
  otherUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherUserId: string | null;
  initialMessages: ThreadMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const latestTimestampRef = useRef<string | null>(initialMessages.at(-1)?.createdAt ?? null);

  // Near-real-time via short-interval polling, not a WebSocket/Realtime
  // push — see roadmap.md Phase 8 for why (RLS/auth integration and
  // live-socket verification are both out of scope for this pass).
  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await getMessagesSince(conversationId, latestTimestampRef.current);
      if (fresh.length === 0) return;
      latestTimestampRef.current = fresh[fresh.length - 1].createdAt.toISOString();
      setMessages((prev) => [
        ...prev,
        ...fresh.map((m) => ({
          id: m.id,
          body: m.body,
          senderId: m.senderId,
          senderName: m.sender.name,
          createdAt: m.createdAt.toISOString(),
        })),
      ]);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="mt-4 flex flex-1 flex-col">
      {otherUserId && (
        <div className="mb-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => {
              if (!confirm("Block this person? They won't be able to start new conversations with you.")) return;
              startTransition(() => blockUser(otherUserId));
            }}
          >
            <ShieldOff className="size-4" /> Block
          </Button>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto rounded-md border p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet — say hi.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn("group flex flex-col", m.senderId === currentUserId ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-1.5 text-sm",
                  m.senderId === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {m.senderId !== currentUserId && (
                  <p className="text-xs font-medium opacity-70">{m.senderName}</p>
                )}
                {m.body}
              </div>
              {m.senderId !== currentUserId && (
                <button
                  type="button"
                  className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground opacity-0 hover:underline group-hover:opacity-100"
                  onClick={() => {
                    const reason = prompt("Why are you reporting this message?");
                    if (!reason) return;
                    startTransition(() => reportMessage({ messageId: m.id, reason }));
                  }}
                >
                  <Flag className="size-3" /> Report
                </button>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form
        ref={formRef}
        action={(formData) => {
          const body = formData.get("body");
          if (typeof body !== "string" || !body.trim()) return;
          startTransition(async () => {
            const message = await sendMessage({ conversationId, body });
            const createdAt = message.createdAt.toISOString();
            // Advance the polling cursor so the next poll doesn't re-fetch
            // (and duplicate) the message this optimistic update just added.
            latestTimestampRef.current = createdAt;
            setMessages((prev) => [
              ...prev,
              { id: message.id, body: message.body, senderId: message.senderId, senderName: "You", createdAt },
            ]);
            formRef.current?.reset();
          });
        }}
        className="mt-3 flex gap-2"
      >
        <Input
          name="body"
          placeholder="Write a message..."
          autoComplete="off"
          disabled={isPending}
          maxLength={4000}
        />
        <Button type="submit" size="icon" aria-label="Send" disabled={isPending}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
