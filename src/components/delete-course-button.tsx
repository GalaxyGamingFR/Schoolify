"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteCourse } from "@/lib/actions/courses";

export function DeleteCourseButton({ courseId }: { courseId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      aria-label="Delete course"
      onClick={() => {
        if (!confirm("Delete this course? Its assignments will be kept but uncategorized.")) return;
        startTransition(async () => {
          await deleteCourse(courseId);
          router.push("/courses");
        });
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
