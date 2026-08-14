"use client";

import { useRef, useState, useTransition } from "react";
import { createAssignment } from "@/lib/actions/assignments";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { AssignmentType, Priority } from "@prisma/client";

const TYPES: AssignmentType[] = [
  "HOMEWORK",
  "READING",
  "PROJECT",
  "ESSAY",
  "EXAM",
  "QUIZ",
  "LAB",
  "OTHER",
];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];

function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}
const TYPE_ITEMS = Object.fromEntries(TYPES.map((t) => [t, titleCase(t)]));
const PRIORITY_ITEMS = Object.fromEntries(PRIORITIES.map((p) => [p, titleCase(p)]));

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function NewAssignmentForm({ courseId }: { courseId: string }) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<AssignmentType>("HOMEWORK");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const title = formData.get("title");
        const dueAtRaw = formData.get("dueAt");
        const minutesRaw = formData.get("estimatedMinutes");
        if (typeof title !== "string" || !title.trim()) return;
        if (typeof dueAtRaw !== "string" || !dueAtRaw) return;

        startTransition(async () => {
          await createAssignment({
            title,
            dueAt: new Date(dueAtRaw),
            courseId,
            type,
            priority,
            estimatedMinutes:
              typeof minutesRaw === "string" && minutesRaw ? Number(minutesRaw) : null,
          });
          formRef.current?.reset();
          setType("HOMEWORK");
          setPriority("MEDIUM");
        });
      }}
      className="flex flex-wrap items-end gap-2 rounded-md border p-3"
    >
      <div className="min-w-[10rem] flex-1">
        <label className="text-xs text-muted-foreground">Title</label>
        <Input name="title" placeholder="Chapter 4 reading" disabled={isPending} required />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Due</label>
        <Input name="dueAt" type="date" defaultValue={todayISO()} disabled={isPending} required />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Type</label>
        <Select value={type} onValueChange={(v) => setType(v as AssignmentType)} items={TYPE_ITEMS}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_ITEMS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Priority</label>
        <Select value={priority} onValueChange={(v) => setPriority(v as Priority)} items={PRIORITY_ITEMS}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_ITEMS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-24">
        <label className="text-xs text-muted-foreground">Est. min</label>
        <Input name="estimatedMinutes" type="number" min={0} placeholder="30" disabled={isPending} />
      </div>
      <Button type="submit" disabled={isPending} size="icon" aria-label="Add assignment">
        <Plus />
      </Button>
    </form>
  );
}
