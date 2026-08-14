"use client";

import { useState, useTransition } from "react";
import { toggleCommentReaction } from "@/lib/actions/blog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { REACTION_EMOJI } from "@/lib/blog-reactions";
import { cn } from "@/lib/utils";
import { SmilePlus } from "lucide-react";

type Reaction = { emoji: string; userId: string };

export function CommentReactions({
  commentId,
  reactions: initialReactions,
  currentUserId,
}: {
  commentId: string;
  reactions: Reaction[];
  currentUserId: string;
}) {
  // Local state, not derived straight from the `reactions` prop -- this
  // updates the instant a reaction is clicked instead of waiting on a
  // server round trip (previously: await the mutation, then router.refresh()
  // the *entire* page just to reflect one emoji).
  const [reactions, setReactions] = useState(initialReactions);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const counts = new Map<string, { count: number; mine: boolean }>();
  for (const r of reactions) {
    const entry = counts.get(r.emoji) ?? { count: 0, mine: false };
    entry.count += 1;
    if (r.userId === currentUserId) entry.mine = true;
    counts.set(r.emoji, entry);
  }

  function react(emoji: string) {
    setOpen(false);
    const hadIt = reactions.some((r) => r.userId === currentUserId && r.emoji === emoji);
    const optimistic = hadIt
      ? reactions.filter((r) => !(r.userId === currentUserId && r.emoji === emoji))
      : [...reactions, { emoji, userId: currentUserId }];
    setReactions(optimistic);

    startTransition(async () => {
      try {
        await toggleCommentReaction(commentId, emoji);
      } catch {
        setReactions(reactions); // revert to the pre-click state
      }
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
