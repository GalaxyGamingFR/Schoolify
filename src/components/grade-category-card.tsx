"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGradeEntry, deleteGradeCategory, deleteGradeEntry } from "@/lib/actions/grades";
import { computeCategoryPercent, letterGrade } from "@/lib/grades";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

type Entry = { id: string; label: string; pointsEarned: number; pointsPossible: number };

export function GradeCategoryCard({
  courseId,
  category,
}: {
  courseId: string;
  category: {
    id: string;
    name: string;
    weight: number;
    dropLowestN: number;
    curveAdjustment: number;
    gradeEntries: Entry[];
  };
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const percent = computeCategoryPercent({
    weight: category.weight,
    dropLowestN: category.dropLowestN,
    curveAdjustment: category.curveAdjustment,
    gradeEntries: category.gradeEntries,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>
            {category.name}{" "}
            <span className="font-normal text-muted-foreground">({category.weight}%)</span>
          </span>
          <div className="flex items-center gap-2">
            {percent !== null && (
              <Badge variant="secondary">
                {percent.toFixed(1)}% · {letterGrade(percent)}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isPending}
              aria-label="Delete category"
              onClick={() => {
                if (!confirm(`Delete "${category.name}" and all its grade entries?`)) return;
                startTransition(async () => {
                  await deleteGradeCategory(category.id, courseId);
                  router.refresh();
                });
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {category.gradeEntries.map((e) => (
          <div key={e.id} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{e.label}</span>
            <span className="text-muted-foreground">
              {e.pointsEarned}/{e.pointsPossible}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isPending}
              aria-label="Delete entry"
              onClick={() => {
                startTransition(async () => {
                  await deleteGradeEntry(e.id, courseId);
                  router.refresh();
                });
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}

        <form
          ref={formRef}
          action={(formData) => {
            const label = formData.get("label");
            const pointsEarned = Number(formData.get("pointsEarned"));
            const pointsPossible = Number(formData.get("pointsPossible"));
            if (typeof label !== "string" || !label.trim() || !pointsPossible) return;

            startTransition(async () => {
              await createGradeEntry({
                categoryId: category.id,
                courseId,
                label,
                pointsEarned,
                pointsPossible,
              });
              formRef.current?.reset();
              router.refresh();
            });
          }}
          className="flex items-center gap-2 pt-1"
        >
          <Input name="label" placeholder="Midterm" disabled={isPending} className="flex-1" />
          <Input
            name="pointsEarned"
            type="number"
            step="any"
            placeholder="88"
            disabled={isPending}
            className="w-16"
          />
          <span className="text-muted-foreground">/</span>
          <Input
            name="pointsPossible"
            type="number"
            step="any"
            placeholder="100"
            disabled={isPending}
            className="w-16"
          />
          <Button type="submit" size="icon-sm" disabled={isPending} aria-label="Add entry">
            <Plus className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
