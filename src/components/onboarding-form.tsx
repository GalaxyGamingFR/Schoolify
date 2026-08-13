"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { Role } from "@prisma/client";
import { GraduationCap, Users } from "lucide-react";

export function OnboardingForm() {
  const [role, setRole] = useState<Role | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!role) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await completeOnboarding({
          role,
          dateOfBirth: role === "STUDENT" ? dateOfBirth : undefined,
        });
        router.push(result.role === "PARENT" ? "/parent" : "/dashboard");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setRole("STUDENT")}
          className={`flex flex-col items-center gap-2 rounded-lg border p-6 text-sm font-medium transition-colors ${
            role === "STUDENT" ? "border-primary bg-primary/5" : "border-input hover:bg-muted"
          }`}
        >
          <GraduationCap className="size-6" />
          I&apos;m a student
        </button>
        <button
          type="button"
          onClick={() => setRole("PARENT")}
          className={`flex flex-col items-center gap-2 rounded-lg border p-6 text-sm font-medium transition-colors ${
            role === "PARENT" ? "border-primary bg-primary/5" : "border-input hover:bg-muted"
          }`}
        >
          <Users className="size-6" />
          I&apos;m a parent/guardian
        </button>
      </div>

      {role === "STUDENT" && (
        <Card>
          <CardContent className="space-y-2 py-4">
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
            <p className="text-xs text-muted-foreground">
              Used only to tailor the experience for younger students — see our approach to
              student privacy for accounts under 13.
            </p>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        className="w-full"
        disabled={!role || (role === "STUDENT" && !dateOfBirth) || isPending}
        onClick={submit}
      >
        Continue
      </Button>
    </div>
  );
}
