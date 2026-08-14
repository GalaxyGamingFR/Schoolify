"use client";

import { useMemo, useState } from "react";
import { requiredScoreForTarget } from "@/lib/grades";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = {
  id: string;
  name: string;
  weight: number;
  dropLowestN: number;
  curveAdjustment: number;
  gradeEntries: { pointsEarned: number; pointsPossible: number }[];
};

// Solves the reverse of the What-if calculator: not "what does this score
// do to my grade" but "what score do I need." See requiredScoreForTarget's
// doc comment for the simplifying assumption (the new assignment isn't a
// dropped-lowest score).
export function GradeOptimizer({ categories }: { categories: Category[] }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [possible, setPossible] = useState("100");
  const [target, setTarget] = useState("90");

  const result = useMemo(() => {
    const targetCategory = categories.find((c) => c.id === categoryId);
    const newAssignmentPossible = Number(possible);
    const targetOverallPercent = Number(target);
    if (!targetCategory || !newAssignmentPossible || !Number.isFinite(targetOverallPercent)) {
      return null;
    }
    const otherCategories = categories.filter((c) => c.id !== categoryId);
    return requiredScoreForTarget({
      otherCategories,
      targetCategory,
      newAssignmentPossible,
      targetOverallPercent,
    });
  }, [categories, categoryId, possible, target]);

  if (categories.length === 0) return null;

  const categoryItems = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Grade optimizer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          What score do you need on an upcoming assignment to hit a target overall grade?
        </p>

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[8rem]">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")} items={categoryItems}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-24">
            <Label className="text-xs text-muted-foreground">Worth (pts)</Label>
            <Input value={possible} onChange={(e) => setPossible(e.target.value)} type="number" step="any" />
          </div>
          <div className="w-24">
            <Label className="text-xs text-muted-foreground">Target %</Label>
            <Input value={target} onChange={(e) => setTarget(e.target.value)} type="number" step="any" />
          </div>
        </div>

        <p className="text-sm">
          {result === null ? (
            <span className="text-muted-foreground">Enter valid numbers above.</span>
          ) : result > 100 ? (
            <span className="text-destructive">
              Not possible — even a perfect score in this category can&apos;t reach that target.
            </span>
          ) : result <= 0 ? (
            <span className="text-emerald-500">
              You&apos;ve already secured this target regardless of this assignment.
            </span>
          ) : (
            <>
              You need <span className="font-semibold">{result.toFixed(1)}%</span> on this
              assignment.
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          Assumes this assignment counts toward the average (not one of the category&apos;s
          dropped-lowest scores, if it drops any).
        </p>
      </CardContent>
    </Card>
  );
}
