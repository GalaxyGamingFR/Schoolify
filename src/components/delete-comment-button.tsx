"use client";

import { useTransition } from "react";
import { deleteComment } from "@/lib/actions/blog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      disabled={isPending}
      aria-label="Delete comment"
      onClick={() => {
        if (!confirm("Delete this comment?")) return;
        startTransition(() => deleteComment(commentId));
      }}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
