"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinCourseByCode } from "@/lib/actions/school";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function JoinCourseForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const code = formData.get("code");
        if (typeof code !== "string" || !code.trim()) return;
        setError(null);
        startTransition(async () => {
          try {
            await joinCourseByCode(code);
            formRef.current?.reset();
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
          }
        });
      }}
      className="space-y-1"
    >
      <div className="flex gap-2">
        <Input
          name="code"
          placeholder="Class join code"
          disabled={isPending}
          className="h-auto rounded-xl py-3 px-4 text-base uppercase"
          maxLength={6}
        />
        <Button type="submit" variant="secondary" disabled={isPending} className="h-auto rounded-xl px-4">
          Join
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
