"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUniversityTarget } from "@/lib/actions/applications";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function NewUniversityTargetForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const name = formData.get("name");
        if (typeof name !== "string" || !name.trim()) return;
        startTransition(async () => {
          await createUniversityTarget({
            name,
            applicationDeadline: (formData.get("applicationDeadline") as string) || undefined,
          });
          formRef.current?.reset();
          router.refresh();
        });
      }}
      className="flex flex-wrap gap-2"
    >
      <Input name="name" placeholder="University or program name" disabled={isPending} className="flex-1" />
      <Input name="applicationDeadline" type="date" disabled={isPending} className="w-40" />
      <Button type="submit" disabled={isPending}>
        <Plus /> Add
      </Button>
    </form>
  );
}
