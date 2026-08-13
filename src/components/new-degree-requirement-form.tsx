"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDegreeRequirement } from "@/lib/actions/degree";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export function NewDegreeRequirementForm({
  existing,
}: {
  existing: { id: string; label: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [requiresId, setRequiresId] = useState<string>("NONE");
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const label = formData.get("label");
        const creditsRequired = formData.get("creditsRequired");
        if (typeof label !== "string" || !label.trim()) return;
        if (typeof creditsRequired !== "string" || !creditsRequired) return;
        setError(null);
        startTransition(async () => {
          try {
            await createDegreeRequirement({
              label,
              category: formData.get("category") as string,
              creditsRequired: Number(creditsRequired),
              requiresId: requiresId === "NONE" ? undefined : requiresId,
            });
            formRef.current?.reset();
            setRequiresId("NONE");
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
          }
        });
      }}
      className="space-y-2 rounded-md border p-3"
    >
      <div className="grid gap-2 sm:grid-cols-4">
        <Input name="label" placeholder="General Ed — English" disabled={isPending} className="sm:col-span-2" />
        <Input name="category" placeholder="Category (optional)" disabled={isPending} />
        <Input name="creditsRequired" type="number" min={0.5} step={0.5} placeholder="Credits" disabled={isPending} />
      </div>
      {existing.length > 0 && (
        <Select value={requiresId} onValueChange={(v) => setRequiresId(v ?? "NONE")}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Requires (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">No prerequisite</SelectItem>
            {existing.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        <Plus /> Add requirement
      </Button>
    </form>
  );
}
