"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteStudySet } from "@/lib/actions/study";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteStudySetButton({ studySetId }: { studySetId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="icon-sm"
      disabled={isPending}
      aria-label="Delete study set"
      onClick={() => {
        if (!confirm("Delete this study set and everything generated from it?")) return;
        startTransition(async () => {
          await deleteStudySet(studySetId);
          router.push("/study");
        });
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
