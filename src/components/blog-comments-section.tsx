"use client";

import { useState } from "react";
import { CommentForm } from "@/components/comment-form";
import { BlogComment } from "@/components/blog-comment";
import { countComments, type CommentData } from "@/lib/comment-tree";

export function BlogCommentsSection({
  postId,
  initialComments,
  currentUserId,
  currentUserName,
  isAdmin,
}: {
  postId: string;
  initialComments: CommentData[];
  currentUserId: string;
  currentUserName: string;
  isAdmin: boolean;
}) {
  const [comments, setComments] = useState(initialComments);

  return (
    <>
      <h2 className="mt-10 text-sm font-semibold text-muted-foreground">
        {countComments(comments)} comment{countComments(comments) === 1 ? "" : "s"}
      </h2>
      <div className="mt-3">
        <CommentForm
          postId={postId}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onUpdate={setComments}
        />
      </div>

      <div className="mt-4 space-y-3">
        {comments.map((c) => (
          <BlogComment
            key={c.id}
            comment={c}
            postId={postId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            isAdmin={isAdmin}
            onUpdate={setComments}
          />
        ))}
      </div>
    </>
  );
}
