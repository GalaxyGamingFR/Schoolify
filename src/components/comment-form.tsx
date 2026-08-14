"use client";

import { useRef, useState, useTransition, type Dispatch, type SetStateAction } from "react";
import { createComment } from "@/lib/actions/blog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { addToTree, replaceInTree, removeFromTree, type CommentData } from "@/lib/comment-tree";

export function CommentForm({
  postId,
  parentId,
  autoFocus,
  placeholder = "Write a comment...",
  onPosted,
  currentUserId,
  currentUserName,
  onUpdate,
}: {
  postId: string;
  parentId?: string;
  autoFocus?: boolean;
  placeholder?: string;
  onPosted?: () => void;
  currentUserId: string;
  currentUserName: string;
  onUpdate: Dispatch<SetStateAction<CommentData[]>>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const body = formData.get("body");
        if (typeof body !== "string" || !body.trim()) return;
        const text = body.trim();
        setError(null);

        // Shown immediately -- the server round trip happens in the
        // background instead of blocking the comment from appearing.
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const optimistic: CommentData = {
          id: tempId,
          body: text,
          createdAt: new Date(),
          authorId: currentUserId,
          author: { name: currentUserName },
          reactions: [],
          replies: [],
        };
        formRef.current?.reset();
        onUpdate((prev) => addToTree(prev, optimistic, parentId));
        onPosted?.();

        startTransition(async () => {
          try {
            const real = await createComment({ postId, body: text, parentId });
            onUpdate((prev) => replaceInTree(prev, tempId, { ...optimistic, id: real.id, createdAt: real.createdAt }, parentId));
          } catch (e) {
            onUpdate((prev) => removeFromTree(prev, tempId, parentId));
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
