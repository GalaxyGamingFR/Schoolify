"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { updateAssignmentStatus, deleteAssignment } from "@/lib/actions/assignments";
import { cn } from "@/lib/utils";
import type { Priority } from "@prisma/client";

const priorityVariant: Record<Priority, "default" | "secondary" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "destructive",
};

export function AssignmentRow({
  id,
  title,
  dueAt,
  done,
  priority,
  courseName,
}: {
  id: string;
  title: string;
  dueAt: Date;
  done: boolean;
  priority: Priority;
  courseName?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
      <Checkbox
        checked={done}
        disabled={isPending}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            await updateAssignmentStatus(id, checked ? "DONE" : "NOT_STARTED");
            router.refresh();
          });
        }}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground">
          {dueAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          {courseName ? ` · ${courseName}` : ""}
        </p>
      </div>
      {priority !== "MEDIUM" && (
        <Badge variant={priorityVariant[priority]} className="hidden sm:inline-flex">
          {priority}
        </Badge>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isPending}
        aria-label="Delete assignment"
        onClick={() => {
          startTransition(async () => {
            await deleteAssignment(id);
            router.refresh();
          });
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
