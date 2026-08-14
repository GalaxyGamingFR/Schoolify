"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/lib/actions/blog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeletePostButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="icon-sm"
      disabled={isPending}
      aria-label="Delete post"
      onClick={() => {
        if (!confirm("Delete this post and all its comments?")) return;
        startTransition(async () => {
          await deletePost(postId);
          router.push("/blog");
        });
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
