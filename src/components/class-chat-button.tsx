"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateCourseConversation } from "@/lib/actions/messaging";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export function ClassChatButton({ courseId }: { courseId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const conversation = await getOrCreateCourseConversation(courseId);
          router.push(`/messages/${conversation.id}`);
        })
      }
    >
      <MessageSquare className="size-4" /> Class chat
    </Button>
  );
}
