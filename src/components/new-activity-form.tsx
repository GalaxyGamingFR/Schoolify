"use client";

import { useRef, useState, useTransition } from "react";
import { createActivity } from "@/lib/actions/portfolio";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { ActivityCategory } from "@prisma/client";

const CATEGORIES: ActivityCategory[] = [
  "CLUB",
  "VOLUNTEER",
  "LEADERSHIP",
  "SUMMER_PROGRAM",
  "AWARD",
  "WORK",
  "OTHER",
];

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  CLUB: "Club",
  VOLUNTEER: "Volunteer",
  LEADERSHIP: "Leadership",
  SUMMER_PROGRAM: "Summer program",
  AWARD: "Award",
  WORK: "Work",
  OTHER: "Other",
};

export function NewActivityForm() {
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<ActivityCategory>("CLUB");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const title = formData.get("title");
        if (typeof title !== "string" || !title.trim()) return;

        startTransition(async () => {
          await createActivity({
            title,
            organization: formData.get("organization") as string,
            category,
            role: formData.get("role") as string,
            description: formData.get("description") as string,
            hoursTotal: formData.get("hoursTotal") ? Number(formData.get("hoursTotal")) : null,
            startDate: (formData.get("startDate") as string) || undefined,
            endDate: (formData.get("endDate") as string) || undefined,
          });
          formRef.current?.reset();
          setCategory("CLUB");
        });
      }}
      className="space-y-3 rounded-md border p-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground">Title</label>
          <Input name="title" placeholder="Robotics Club" disabled={isPending} required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Organization</label>
          <Input name="organization" placeholder="Lincoln High School" disabled={isPending} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Category</label>
          <Select value={category} onValueChange={(v) => setCategory(v as ActivityCategory)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Role</label>
          <Input name="role" placeholder="Team Captain" disabled={isPending} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Start date</label>
          <Input name="startDate" type="date" disabled={isPending} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">End date (blank if ongoing)</label>
          <Input name="endDate" type="date" disabled={isPending} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Total hours</label>
          <Input name="hoursTotal" type="number" min={0} disabled={isPending} />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Description</label>
        <Textarea name="description" placeholder="What you did, what you're proud of" disabled={isPending} />
      </div>
      <Button type="submit" disabled={isPending}>
        <Plus /> Add to portfolio
      </Button>
    </form>
  );
}
