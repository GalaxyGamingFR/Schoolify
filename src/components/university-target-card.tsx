"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  addApplicationTask,
  deleteApplicationTask,
  deleteUniversityTarget,
  toggleApplicationTask,
  updateUniversityStatus,
} from "@/lib/actions/applications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { ApplicationStatus } from "@prisma/client";

const STATUSES: ApplicationStatus[] = [
  "RESEARCHING",
  "APPLYING",
  "SUBMITTED",
  "ACCEPTED",
  "REJECTED",
  "WAITLISTED",
  "DECLINED",
];

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  RESEARCHING: "Researching",
  APPLYING: "Applying",
  SUBMITTED: "Submitted",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WAITLISTED: "Waitlisted",
  DECLINED: "Declined",
};

type Task = { id: string; title: string; done: boolean; dueDate: Date | null };
type Target = {
  id: string;
  name: string;
  status: ApplicationStatus;
  applicationDeadline: Date | null;
  notes: string | null;
  tasks: Task[];
};

export function UniversityTargetCard({ target }: { target: Target }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const taskFormRef = useRef<HTMLFormElement>(null);

  const doneCount = target.tasks.filter((t) => t.done).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
          <span>{target.name}</span>
          <div className="flex items-center gap-2">
            <Select
              value={target.status}
              onValueChange={(v) =>
                startTransition(async () => {
                  await updateUniversityStatus(target.id, v as ApplicationStatus);
                  router.refresh();
                })
              }
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remove"
              disabled={isPending}
              onClick={() => {
                if (!confirm(`Remove ${target.name}?`)) return;
                startTransition(async () => {
                  await deleteUniversityTarget(target.id);
                  router.refresh();
                });
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {(target.applicationDeadline || target.notes) && (
          <p className="text-muted-foreground">
            {target.applicationDeadline && `Deadline: ${format(target.applicationDeadline, "MMM d, yyyy")}`}
            {target.applicationDeadline && target.notes && " · "}
            {target.notes}
          </p>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Checklist ({doneCount}/{target.tasks.length})
          </p>
          {target.tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <Checkbox
                checked={t.done}
                onCheckedChange={() =>
                  startTransition(async () => {
                    await toggleApplicationTask(t.id);
                    router.refresh();
                  })
                }
              />
              <span className={t.done ? "flex-1 text-muted-foreground line-through" : "flex-1"}>
                {t.title}
              </span>
              {t.dueDate && <span className="text-xs text-muted-foreground">{format(t.dueDate, "MMM d")}</span>}
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Delete task"
                onClick={() =>
                  startTransition(async () => {
                    await deleteApplicationTask(t.id);
                    router.refresh();
                  })
                }
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>

        <form
          ref={taskFormRef}
          action={(formData) => {
            const title = formData.get("title");
            if (typeof title !== "string" || !title.trim()) return;
            startTransition(async () => {
              await addApplicationTask({ targetId: target.id, title });
              taskFormRef.current?.reset();
              router.refresh();
            });
          }}
          className="flex gap-2"
        >
          <Input name="title" placeholder="Add a task — essay, recommendation, transcript..." disabled={isPending} />
          <Button type="submit" size="icon" aria-label="Add task" disabled={isPending}>
            <Plus />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
