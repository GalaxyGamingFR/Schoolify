"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CalendarDays, Trash2 } from "lucide-react";
import { deleteCalendarEvent } from "@/lib/actions/calendar";

export function EventRow({
  id,
  title,
  startsAt,
  location,
}: {
  id: string;
  title: string;
  startsAt: Date;
  location: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
      <CalendarDays className="size-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          {startsAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          {location ? ` · ${location}` : ""}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isPending}
        aria-label="Delete event"
        onClick={() => {
          startTransition(async () => {
            await deleteCalendarEvent(id);
            router.refresh();
          });
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
