"use client";

import { useMemo, useState } from "react";
import { computeCourseGrade, letterGrade } from "@/lib/grades";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

type Category = {
  id: string;
  name: string;
  weight: number;
  dropLowestN: number;
  curveAdjustment: number;
  gradeEntries: { pointsEarned: number; pointsPossible: number }[];
};

type Hypothetical = { categoryId: string; pointsEarned: number; pointsPossible: number };

// Client-side only — nothing here is persisted. Lets a student see how a
// not-yet-taken assignment would move their grade before it exists for real.
export function WhatIfCalculator({ categories }: { categories: Category[] }) {
  const [hypotheticals, setHypotheticals] = useState<Hypothetical[]>([]);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [earned, setEarned] = useState("");
  const [possible, setPossible] = useState("");

  const projected = useMemo(() => {
    const merged = categories.map((c) => ({
      weight: c.weight,
      dropLowestN: c.dropLowestN,
      curveAdjustment: c.curveAdjustment,
      gradeEntries: [
        ...c.gradeEntries,
        ...hypotheticals.filter((h) => h.categoryId === c.id).map(({ pointsEarned, pointsPossible }) => ({ pointsEarned, pointsPossible })),
      ],
    }));
    return computeCourseGrade(merged);
  }, [categories, hypotheticals]);

  if (categories.length === 0) return null;

  const categoryItems = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">What if?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[8rem]">
            <label className="text-xs text-muted-foreground">Category</label>
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
          <div className="w-20">
            <label className="text-xs text-muted-foreground">Score</label>
            <Input value={earned} onChange={(e) => setEarned(e.target.value)} type="number" step="any" placeholder="85" />
          </div>
          <span className="pb-1.5 text-muted-foreground">/</span>
          <div className="w-20">
            <label className="text-xs text-muted-foreground">Out of</label>
            <Input value={possible} onChange={(e) => setPossible(e.target.value)} type="number" step="any" placeholder="100" />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!categoryId || !earned || !possible}
            onClick={() => {
              setHypotheticals((h) => [
                ...h,
                { categoryId, pointsEarned: Number(earned), pointsPossible: Number(possible) },
              ]);
              setEarned("");
              setPossible("");
            }}
          >
            Add
          </Button>
        </div>

        {hypotheticals.length > 0 && (
          <div className="space-y-1">
            {hypotheticals.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {categories.find((c) => c.id === h.categoryId)?.name}: {h.pointsEarned}/
                  {h.pointsPossible}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove"
                  onClick={() => setHypotheticals((hs) => hs.filter((_, idx) => idx !== i))}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm">
          Projected course grade:{" "}
          <span className="font-semibold">
            {projected !== null ? `${projected.toFixed(1)}% (${letterGrade(projected)})` : "—"}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
