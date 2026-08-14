"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { formatDistanceToNow } from "date-fns";
import { CommentForm } from "@/components/comment-form";
import { CommentReactions } from "@/components/comment-reactions";
import { DeleteCommentButton } from "@/components/delete-comment-button";
import { Button } from "@/components/ui/button";
import { Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommentData } from "@/lib/comment-tree";

export function BlogComment({
  comment,
  postId,
  currentUserId,
  currentUserName,
  isAdmin,
  onUpdate,
  isReply = false,
  parentId,
}: {
  comment: CommentData;
  postId: string;
  currentUserId: string;
  currentUserName: string;
  isAdmin: boolean;
  onUpdate: Dispatch<SetStateAction<CommentData[]>>;
  isReply?: boolean;
  // Id of the top-level comment this one belongs to -- only meaningful
  // when isReply is true, since replies can't themselves have replies.
  parentId?: string;
}) {
  const [replying, setReplying] = useState(false);

  return (
    <div className={cn(!isReply && "border-b pb-3 last:border-none")}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm">
          <p className="font-medium">
            {comment.author.name}{" "}
            <span className="font-normal text-muted-foreground">
              · {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
            </span>
          </p>
          <p className="mt-0.5">{comment.body}</p>
          <CommentReactions
            commentId={comment.id}
            reactions={comment.reactions}
            currentUserId={currentUserId}
          />
          {!isReply && (
            <Button
              variant="ghost"
              size="xs"
              className="mt-1 -ml-2 text-muted-foreground"
              onClick={() => setReplying((v) => !v)}
            >
              <Reply className="size-3.5" /> Reply
            </Button>
          )}
        </div>
        {(comment.authorId === currentUserId || isAdmin) && (
          <DeleteCommentButton
            commentId={comment.id}
            parentId={isReply ? parentId : undefined}
            comment={comment}
            onUpdate={onUpdate}
          />
        )}
      </div>

      {replying && (
        <div className="mt-2 ml-4">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            placeholder={`Reply to ${comment.author.name}...`}
            autoFocus
            onPosted={() => setReplying(false)}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onUpdate={onUpdate}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 ml-4 space-y-3 border-l pl-4">
          {comment.replies.map((r) => (
            <BlogComment
              key={r.id}
              comment={r}
              postId={postId}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isAdmin={isAdmin}
              onUpdate={onUpdate}
              isReply
              parentId={comment.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
