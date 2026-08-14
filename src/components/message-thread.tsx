"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import { blockUser, getMessagesSince, reportMessage, sendMessage } from "@/lib/actions/messaging";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flag, Send, ShieldOff, Paperclip, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 4000;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5MB, matches src/app/api/upload/route.ts
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

type ThreadMessage = {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
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
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; type: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
          attachmentUrl: m.attachmentUrl,
          attachmentType: m.attachmentType,
        })),
      ]);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function handleFileSelect(file: File | undefined) {
    setAttachError(null);
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAttachError("Only JPEG, PNG, GIF, or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachError("Image is too large (max 5MB).");
      return;
    }

    setIsUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setPendingAttachment({ url: blob.url, type: file.type });
    } catch {
      setAttachError("Upload failed — try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

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
                {m.attachmentUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- Vercel Blob CDN URL, not a local/optimizable asset
                  <img
                    src={m.attachmentUrl}
                    alt="Attachment"
                    className="mt-1 max-h-64 rounded-md object-contain"
                  />
                )}
                {m.body && <p className={m.attachmentUrl ? "mt-1" : undefined}>{m.body}</p>}
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

      {pendingAttachment && (
        <div className="mt-2 flex items-center gap-2 rounded-md border p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- Vercel Blob CDN URL */}
          <img src={pendingAttachment.url} alt="Attachment preview" className="size-12 rounded object-cover" />
          <span className="flex-1 text-xs text-muted-foreground">Ready to send</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove attachment"
            onClick={() => setPendingAttachment(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
      {attachError && <p className="mt-1 text-xs text-destructive">{attachError}</p>}

      <form
        ref={formRef}
        action={(formData) => {
          const body = formData.get("body");
          const text = typeof body === "string" ? body.trim() : "";
          if (!text && !pendingAttachment) return;
          startTransition(async () => {
            const message = await sendMessage({
              conversationId,
              body: text,
              attachmentUrl: pendingAttachment?.url,
              attachmentType: pendingAttachment?.type,
            });
            const createdAt = message.createdAt.toISOString();
            // Advance the polling cursor so the next poll doesn't re-fetch
            // (and duplicate) the message this optimistic update just added.
            latestTimestampRef.current = createdAt;
            setMessages((prev) => [
              ...prev,
              {
                id: message.id,
                body: message.body,
                senderId: message.senderId,
                senderName: "You",
                createdAt,
                attachmentUrl: message.attachmentUrl,
                attachmentType: message.attachmentType,
              },
            ]);
            formRef.current?.reset();
            setPendingAttachment(null);
          });
        }}
        className="mt-3 flex gap-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Attach image or GIF"
          disabled={isUploading || !!pendingAttachment}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        </Button>
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
