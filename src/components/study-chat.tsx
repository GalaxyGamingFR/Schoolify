"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type InitialMessage = { id: string; role: "user" | "assistant"; body: string };

export function StudyChat({
  studySetId,
  initialMessages,
}: {
  studySetId: string;
  initialMessages: InitialMessage[];
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: "/api/study-chat", body: { studySetId } }),
    messages: initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: [{ type: "text" as const, text: m.body }],
    })),
  });

  const busy = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="flex h-full flex-col rounded-lg border">
      <div className="flex items-center gap-1.5 border-b px-3 py-2 text-sm font-semibold">
        <Sparkles className="size-3.5 text-primary" /> Ask about your notes
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ask a question about this study set — I&apos;ll answer from your notes.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-lg px-3 py-2 text-sm",
              m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            {m.parts
              .filter((p) => p.type === "text")
              .map((p, i) =>
                m.role === "user" ? (
                  <span key={i} className="whitespace-pre-wrap">
                    {p.text}
                  </span>
                ) : (
                  <div key={i} className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 first:[&_p]:mt-0 last:[&_p]:mb-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.text}</ReactMarkdown>
                  </div>
                ),
              )}
          </div>
        ))}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span className="flex-1">{error.message}</span>
            <Button variant="ghost" size="xs" onClick={() => regenerate()}>
              <RotateCcw className="size-3.5" /> Retry
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={busy}
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={busy} aria-label="Send">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
