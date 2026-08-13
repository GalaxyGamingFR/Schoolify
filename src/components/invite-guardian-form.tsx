"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteGuardian } from "@/lib/actions/guardianship";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function InviteGuardianForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const email = formData.get("email");
        if (typeof email !== "string" || !email.trim()) return;
        setError(null);
        startTransition(async () => {
          try {
            await inviteGuardian(email);
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
        <Input
          name="email"
          type="email"
          placeholder="Parent/guardian's email"
          disabled={isPending}
          required
        />
        <Button type="submit" disabled={isPending}>
          Link
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
