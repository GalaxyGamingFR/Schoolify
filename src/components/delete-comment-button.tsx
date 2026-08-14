"use client";

import { useTransition, type Dispatch, type SetStateAction } from "react";
import { deleteComment } from "@/lib/actions/blog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { removeFromTree, addToTree, type CommentData } from "@/lib/comment-tree";

export function DeleteCommentButton({
  commentId,
  parentId,
  comment,
  onUpdate,
}: {
  commentId: string;
  parentId?: string;
  comment: CommentData;
  onUpdate: Dispatch<SetStateAction<CommentData[]>>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      disabled={isPending}
      aria-label="Delete comment"
      onClick={() => {
        if (!confirm("Delete this comment?")) return;
        onUpdate((prev) => removeFromTree(prev, commentId, parentId));
        startTransition(async () => {
          try {
            await deleteComment(commentId);
          } catch {
            onUpdate((prev) => addToTree(prev, comment, parentId));
          }
        });
      }}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
