"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CommentForm } from "@/components/comment-form";
import { CommentReactions } from "@/components/comment-reactions";
import { DeleteCommentButton } from "@/components/delete-comment-button";
import { Button } from "@/components/ui/button";
import { Reply } from "lucide-react";
import { cn } from "@/lib/utils";

type CommentData = {
  id: string;
  body: string;
  createdAt: Date;
  authorId: string;
  author: { name: string };
  reactions: { emoji: string; userId: string }[];
  replies?: CommentData[];
};

export function BlogComment({
  comment,
  postId,
  currentUserId,
  isAdmin,
  isReply = false,
}: {
  comment: CommentData;
  postId: string;
  currentUserId: string;
  isAdmin: boolean;
  isReply?: boolean;
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
        {(comment.authorId === currentUserId || isAdmin) && <DeleteCommentButton commentId={comment.id} />}
      </div>

      {replying && (
        <div className="mt-2 ml-4">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            placeholder={`Reply to ${comment.author.name}...`}
            autoFocus
            onPosted={() => setReplying(false)}
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
              isAdmin={isAdmin}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
