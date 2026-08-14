"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createComment } from "@/lib/actions/blog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export function CommentForm({
  postId,
  parentId,
  autoFocus,
  placeholder = "Write a comment...",
  onPosted,
}: {
  postId: string;
  parentId?: string;
  autoFocus?: boolean;
  placeholder?: string;
  onPosted?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const body = formData.get("body");
        if (typeof body !== "string" || !body.trim()) return;
        setError(null);
        startTransition(async () => {
          try {
            await createComment({ postId, body, parentId });
            formRef.current?.reset();
            router.refresh();
            onPosted?.();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
          }
        });
      }}
      className="space-y-1"
    >
      <div className="flex gap-2">
        <Input
          name="body"
          placeholder={placeholder}
          disabled={isPending}
          maxLength={2000}
          autoComplete="off"
          autoFocus={autoFocus}
        />
        <Button type="submit" size="icon" aria-label="Post comment" disabled={isPending}>
          <Send className="size-4" />
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
