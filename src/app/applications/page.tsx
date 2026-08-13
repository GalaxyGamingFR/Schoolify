import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { NewUniversityTargetForm } from "@/components/new-university-target-form";
import { UniversityTargetCard } from "@/components/university-target-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function ApplicationsPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const targets = await prisma.universityTarget.findMany({
    where: { userId: user.id },
    include: { tasks: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ applicationDeadline: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track schools you&apos;re applying to and the checklist for each — essays, recommendation
          letters, test scores, transcript requests.
        </p>

        <div className="mt-6">
          <NewUniversityTargetForm />
        </div>

        <div className="mt-6 space-y-3">
          {targets.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                No schools added yet — add one above to start a checklist.
              </CardContent>
            </Card>
          ) : (
            targets.map((t) => <UniversityTargetCard key={t.id} target={t} />)
          )}
        </div>
      </main>
    </div>
  );
}
