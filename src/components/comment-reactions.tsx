"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCommentReaction } from "@/lib/actions/blog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { REACTION_EMOJI } from "@/lib/blog-reactions";
import { cn } from "@/lib/utils";
import { SmilePlus } from "lucide-react";

export function CommentReactions({
  commentId,
  reactions,
  currentUserId,
}: {
  commentId: string;
  reactions: { emoji: string; userId: string }[];
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const counts = new Map<string, { count: number; mine: boolean }>();
  for (const r of reactions) {
    const entry = counts.get(r.emoji) ?? { count: 0, mine: false };
    entry.count += 1;
    if (r.userId === currentUserId) entry.mine = true;
    counts.set(r.emoji, entry);
  }

  function react(emoji: string) {
    setOpen(false);
    startTransition(async () => {
      await toggleCommentReaction(commentId, emoji);
      router.refresh();
    });
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {[...counts.entries()].map(([emoji, { count, mine }]) => (
        <button
          key={emoji}
          type="button"
          disabled={isPending}
          onClick={() => react(emoji)}
          className={cn(
            "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
            mine
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
          )}
        >
          <span>{emoji}</span>
          <span className="tabular-nums">{count}</span>
        </button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-label="Add reaction"
              disabled={isPending}
              className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <SmilePlus className="size-3.5" />
            </button>
          }
        />
        <PopoverContent className="w-auto p-1">
          <div className="flex gap-0.5">
            {REACTION_EMOJI.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => react(emoji)}
                className="flex size-8 items-center justify-center rounded-md text-lg hover:bg-muted"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
