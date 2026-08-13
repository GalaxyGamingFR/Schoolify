"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSchoolCourse } from "@/lib/actions/school";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function CreateSchoolCourseForm({ schoolId }: { schoolId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const name = formData.get("name");
        if (typeof name !== "string" || !name.trim()) return;
        setError(null);
        startTransition(async () => {
          try {
            await createSchoolCourse({ schoolId, name });
            formRef.current?.reset();
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
          }
        });
      }}
      className="space-y-2"
    >
      <div className="flex gap-2">
        <Input name="name" placeholder="Class name, e.g. Algebra II — Period 3" disabled={isPending} />
        <Button type="submit" disabled={isPending} size="icon" aria-label="Create class">
          <Plus />
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
