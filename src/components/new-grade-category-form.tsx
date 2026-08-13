"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGradeCategory } from "@/lib/actions/grades";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function NewGradeCategoryForm({ courseId }: { courseId: string }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const name = formData.get("name");
        const weight = Number(formData.get("weight"));
        const dropLowestN = Number(formData.get("dropLowestN") || 0);
        if (typeof name !== "string" || !name.trim() || !weight) return;

        startTransition(async () => {
          await createGradeCategory({ courseId, name, weight, dropLowestN });
          formRef.current?.reset();
          router.refresh();
        });
      }}
      className="flex flex-wrap items-end gap-2 rounded-md border p-3"
    >
      <div className="min-w-[8rem] flex-1">
        <label className="text-xs text-muted-foreground">Category</label>
        <Input name="name" placeholder="Exams" disabled={isPending} required />
      </div>
      <div className="w-24">
        <label className="text-xs text-muted-foreground">Weight %</label>
        <Input name="weight" type="number" min={0} max={100} placeholder="40" disabled={isPending} required />
      </div>
      <div className="w-28">
        <label className="text-xs text-muted-foreground">Drop lowest</label>
        <Input name="dropLowestN" type="number" min={0} defaultValue={0} disabled={isPending} />
      </div>
      <Button type="submit" disabled={isPending} size="icon" aria-label="Add category">
        <Plus />
      </Button>
    </form>
  );
}
