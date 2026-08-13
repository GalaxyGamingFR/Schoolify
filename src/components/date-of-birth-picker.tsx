"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// A plain type="date" input needs someone to hand-type "2013-05-15" digit by
// digit, or click a browser-native picker that looks nothing like the rest
// of the app — a genuinely bad first impression for the very first thing a
// new student does. A dropdown-driven calendar (jump straight to a year
// instead of clicking "previous month" ~180 times for a 15-year-old) is a
// much faster, friendlier way to pick a birthdate specifically.
export function DateOfBirthPicker({
  value,
  onChange,
  disabled,
}: {
  value: string; // "yyyy-MM-dd", matches what the form/action already expects
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const today = new Date();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn("w-full justify-start font-normal", !selected && "text-muted-foreground")}
          >
            <CalendarIcon className="size-4" />
            {selected ? format(selected, "MMMM d, yyyy") : "Pick a date"}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          startMonth={new Date(today.getFullYear() - 100, 0)}
          endMonth={today}
          selected={selected}
          defaultMonth={selected ?? new Date(today.getFullYear() - 15, today.getMonth())}
          disabled={{ after: today }}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
