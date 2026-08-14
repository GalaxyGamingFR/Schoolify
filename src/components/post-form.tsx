"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost } from "@/lib/actions/blog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function PostForm({ post }: { post?: { id: string; title: string; body: string } }) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!title.trim() || !body.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        if (post) {
          await updatePost(post.id, { title, body });
          router.push(`/blog/${post.id}`);
        } else {
          const created = await createPost({ title, body });
          router.push(`/blog/${created.id}`);
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" disabled={isPending} maxLength={200} />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write the post..."
        disabled={isPending}
        rows={10}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button disabled={isPending || !title.trim() || !body.trim()} onClick={submit}>
        {post ? "Save changes" : "Publish"}
      </Button>
    </div>
  );
}
