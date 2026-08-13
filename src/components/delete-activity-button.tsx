"use client";

import { useTransition } from "react";
import { deleteActivity } from "@/lib/actions/portfolio";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteActivityButton({ activityId }: { activityId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      aria-label="Delete activity"
      onClick={() => {
        if (!confirm("Remove this from your portfolio?")) return;
        startTransition(() => deleteActivity(activityId));
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
