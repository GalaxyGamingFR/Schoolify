"use client";

import { useRef, useState, useTransition } from "react";
import { sendBroadcast } from "@/lib/actions/moderation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";

export function BroadcastForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const title = formData.get("title");
        const body = formData.get("body");
        if (typeof title !== "string" || !title.trim()) return;
        setError(null);
        setSent(false);
        startTransition(async () => {
          try {
            await sendBroadcast({ title, body: typeof body === "string" ? body : undefined });
            formRef.current?.reset();
            setSent(true);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
          }
        });
      }}
      className="space-y-2"
    >
      <Input name="title" placeholder="Announcement title" disabled={isPending} maxLength={200} required />
      <Textarea name="body" placeholder="Details (optional)" disabled={isPending} maxLength={1000} rows={3} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {sent && <p className="text-sm text-emerald-500">Sent to everyone.</p>}
      <Button type="submit" size="sm" disabled={isPending}>
        <Megaphone className="size-4" /> Send broadcast
      </Button>
    </form>
  );
}
