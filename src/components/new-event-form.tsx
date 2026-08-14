"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCalendarEvent } from "@/lib/actions/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export function NewEventForm({ defaultDate }: { defaultDate: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add event
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const title = formData.get("title");
        const date = formData.get("date");
        const time = formData.get("time");
        const location = formData.get("location");
        if (typeof title !== "string" || !title.trim()) return;
        if (typeof date !== "string" || !date) return;

        const startsAt = new Date(`${date}T${typeof time === "string" && time ? time : "09:00"}`);
        startTransition(async () => {
          await createCalendarEvent({
            title,
            startsAt,
            location: typeof location === "string" ? location : undefined,
          });
          formRef.current?.reset();
          setOpen(false);
          router.refresh();
        });
      }}
      className="flex flex-wrap items-end gap-2 rounded-md border p-3"
    >
      <div className="min-w-[10rem] flex-1">
        <label className="text-xs text-muted-foreground">Title</label>
        <Input name="title" placeholder="Parent-teacher conference" disabled={isPending} autoFocus required />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Date</label>
        <Input name="date" type="date" defaultValue={defaultDate} disabled={isPending} required />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Time</label>
        <Input name="time" type="time" disabled={isPending} />
      </div>
      <div className="min-w-[8rem]">
        <label className="text-xs text-muted-foreground">Location (optional)</label>
        <Input name="location" placeholder="Room 204" disabled={isPending} />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        Add
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Cancel" onClick={() => setOpen(false)}>
        <X className="size-4" />
      </Button>
    </form>
  );
}
