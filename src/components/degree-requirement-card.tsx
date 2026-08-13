"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDegreeRequirement, updateCreditsCompleted } from "@/lib/actions/degree";
import { requirementPercent, isRequirementComplete } from "@/lib/degree";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Lock } from "lucide-react";

type Requirement = {
  id: string;
  label: string;
  category: string | null;
  creditsRequired: number;
  creditsCompleted: number;
  requiresLabel: string | null;
  blocked: boolean;
};

export function DegreeRequirementCard({ requirement }: { requirement: Requirement }) {
  const [credits, setCredits] = useState(String(requirement.creditsCompleted));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const complete = isRequirementComplete(requirement);

  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{requirement.label}</p>
            <p className="text-xs text-muted-foreground">
              {requirement.category}
              {requirement.category && requirement.requiresLabel && " · "}
              {requirement.requiresLabel && `Requires: ${requirement.requiresLabel}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {requirement.blocked && (
              <Badge variant="outline" className="gap-1">
                <Lock className="size-3" /> Blocked
              </Badge>
            )}
            {complete && <Badge>Complete</Badge>}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remove requirement"
              disabled={isPending}
              onClick={() => {
                if (!confirm(`Remove "${requirement.label}"?`)) return;
                startTransition(async () => {
                  await deleteDegreeRequirement(requirement.id);
                  router.refresh();
                });
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <Progress value={requirementPercent(requirement)} />

        <div className="flex items-center gap-2 text-sm">
          <Input
            type="number"
            min={0}
            step={0.5}
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            onBlur={() => {
              const value = Number(credits);
              if (Number.isNaN(value) || value === requirement.creditsCompleted) return;
              startTransition(async () => {
                await updateCreditsCompleted(requirement.id, value);
                router.refresh();
              });
            }}
            disabled={isPending}
            className="w-20"
          />
          <span className="text-muted-foreground">/ {requirement.creditsRequired} credits</span>
        </div>
      </CardContent>
    </Card>
  );
}
