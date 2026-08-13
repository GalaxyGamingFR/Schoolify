"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startDirectConversation } from "@/lib/actions/messaging";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export function MessageUserButton({ userId, label = "Message" }: { userId: string; label?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function send() {
    setError(null);
    startTransition(async () => {
      try {
        const conversation = await startDirectConversation(userId);
        router.push(`/messages/${conversation.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" disabled={isPending} onClick={send}>
        <MessageSquare className="size-4" /> {label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
