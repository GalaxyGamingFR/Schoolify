"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { quickAddAssignment } from "@/lib/actions/assignments";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// The whole Phase 1 quick-add promise: type a title, press Enter. Due date
// defaults to today; categorize into a course later from /courses.
export function QuickAddForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const title = formData.get("title");
        if (typeof title !== "string" || !title.trim()) return;
        startTransition(async () => {
          await quickAddAssignment({ title });
          formRef.current?.reset();
          router.refresh();
        });
      }}
      className="flex gap-2"
    >
      <Input
        name="title"
        placeholder="Add a task for today — press Enter"
        disabled={isPending}
        autoFocus
      />
      <Button type="submit" disabled={isPending} size="icon" aria-label="Add task">
        <Plus />
      </Button>
    </form>
  );
}
