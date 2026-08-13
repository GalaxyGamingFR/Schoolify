import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import {
  BADGES,
  calculateLevel,
  calculateOnTimeStreak,
  calculateStreak,
  calculateXp,
  evaluateBadges,
} from "@/lib/gamification";
import { AppNav } from "@/components/app-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Progress",
  description: "XP, levels, streaks, and badges.",
};

export default async function ProgressPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const completed = await prisma.assignment.findMany({
    where: { userId: user.id, status: "DONE", completedAt: { not: null } },
    select: { completedAt: true, dueAt: true },
  });
  const completions = completed.map((c) => ({ completedAt: c.completedAt!, dueAt: c.dueAt }));

  const xp = calculateXp(completions);
  const level = calculateLevel(xp);
  const streak = calculateStreak(completions.map((c) => c.completedAt));
  const onTimeStreak = calculateOnTimeStreak(completions);
  const earned = evaluateBadges({
    completedCount: completions.length,
    longestStreak: streak.longestStreak,
    currentOnTimeStreak: onTimeStreak,
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Level {level.level}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={(level.xpIntoLevel / level.xpForNextLevel) * 100} />
              <p className="mt-2 text-sm text-muted-foreground">
                {level.xpIntoLevel} / {level.xpForNextLevel} XP to level {level.level + 1} ·{" "}
                {xp} XP total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base">
                <Flame className="size-4 text-orange-500" /> Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{streak.currentStreak} days</p>
              <p className="text-sm text-muted-foreground">
                Longest: {streak.longestStreak} day{streak.longestStreak === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>
        </div>

        <h2 className="mt-8 text-sm font-semibold text-muted-foreground">Badges</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {BADGES.map((badge) => {
            const have = earned.has(badge.id);
            return (
              <Card key={badge.id} className={cn(!have && "opacity-50")}>
                <CardContent className="flex items-center gap-3 py-4">
                  {have ? (
                    <Trophy className="size-8 shrink-0 text-yellow-500" />
                  ) : (
                    <Lock className="size-8 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{badge.name}</p>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {completions.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">
            Complete an assignment to start earning XP and badges.
          </p>
        )}
      </main>
    </div>
  );
}
