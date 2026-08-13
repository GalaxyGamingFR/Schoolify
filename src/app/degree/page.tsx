import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { overallProgress, isBlocked } from "@/lib/degree";
import { AppNav } from "@/components/app-nav";
import { NewDegreeRequirementForm } from "@/components/new-degree-requirement-form";
import { DegreeRequirementCard } from "@/components/degree-requirement-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "Degree Plan",
  description: "Track your own custom degree requirements and credits.",
};

export default async function DegreePage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const requirements = await prisma.degreeRequirement.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  const overall = overallProgress(requirements);
  const labelById = new Map(requirements.map((r) => [r.id, r.label]));

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Degree plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your own custom requirement list — not tied to any specific institution&apos;s official
          curriculum, since we don&apos;t have that data. Add what your program actually requires
          and track credits as you complete them.
        </p>

        {requirements.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Overall progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={overall.percent} />
              <p className="mt-2 text-sm text-muted-foreground">
                {overall.creditsCompleted} / {overall.creditsRequired} credits ·{" "}
                {overall.percent.toFixed(0)}%
              </p>
            </CardContent>
          </Card>
        )}

        <div className="mt-6">
          <NewDegreeRequirementForm
            existing={requirements.map((r) => ({ id: r.id, label: r.label }))}
          />
        </div>

        <div className="mt-6 space-y-2">
          {requirements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requirements yet — add your first above.</p>
          ) : (
            requirements.map((r) => (
              <DegreeRequirementCard
                key={r.id}
                requirement={{
                  id: r.id,
                  label: r.label,
                  category: r.category,
                  creditsRequired: r.creditsRequired,
                  creditsCompleted: r.creditsCompleted,
                  requiresLabel: r.requiresId ? (labelById.get(r.requiresId) ?? null) : null,
                  blocked: isBlocked(r, requirements),
                }}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
