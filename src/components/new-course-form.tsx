"use client";

import { useRef, useTransition } from "react";
import { createCourse } from "@/lib/actions/courses";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function NewCourseForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const name = formData.get("name");
        if (typeof name !== "string" || !name.trim()) return;
        startTransition(async () => {
          await createCourse(name);
          formRef.current?.reset();
        });
      }}
      className="flex gap-2"
    >
      <Input name="name" placeholder="Add a course, e.g. AP Biology" disabled={isPending} />
      <Button type="submit" disabled={isPending} size="icon" aria-label="Add course">
        <Plus />
      </Button>
    </form>
  );
}
