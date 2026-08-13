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
      className="relative"
    >
      <Input
        name="name"
        placeholder="Add a course, e.g. AP Biology"
        disabled={isPending}
        className="h-auto rounded-xl py-3 pr-11 pl-4 text-base"
      />
      <Button
        type="submit"
        disabled={isPending}
        size="icon-sm"
        variant="ghost"
        aria-label="Add course"
        className="absolute top-1/2 right-1.5 -translate-y-1/2"
      >
        <Plus />
      </Button>
    </form>
  );
}
