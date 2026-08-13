"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OpportunitySubject } from "@prisma/client";

const SUBJECT_LABELS: Record<OpportunitySubject, string> = {
  STEM: "STEM",
  MATH: "Math",
  SCIENCE: "Science",
  COMPUTER_SCIENCE: "Computer Science",
  ENGINEERING: "Engineering",
  BUSINESS: "Business",
  WRITING: "Writing",
  DEBATE: "Debate",
  ARTS: "Arts",
  GENERAL: "General",
};

export function OpportunityFilters({
  subject,
  grade,
  q,
}: {
  subject?: string;
  grade?: string;
  q?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/opportunities?${params.toString()}`);
  }

  const hasFilters = !!(subject || grade || q);

  return (
    <div className="space-y-2">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
          updateParam("q", value || null);
        }}
      >
        <Input name="q" defaultValue={q} placeholder="Search..." className="min-w-[10rem] flex-1" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Select value={subject ?? "ALL"} onValueChange={(v) => updateParam("subject", v === "ALL" ? null : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All subjects</SelectItem>
            {Object.entries(SUBJECT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={grade ?? "ALL"} onValueChange={(v) => updateParam("grade", v === "ALL" ? null : v)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Any grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any grade</SelectItem>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <SelectItem key={g} value={String(g)}>
                Grade {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => router.push("/opportunities")}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
