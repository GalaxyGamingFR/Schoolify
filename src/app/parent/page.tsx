import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { RequestStudentLinkForm } from "@/components/request-student-link-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Clock } from "lucide-react";

export default async function ParentPortalPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingCompletedAt) redirect("/onboarding");
  if (user.role !== "PARENT") redirect("/dashboard");

  const guardianships = await prisma.guardianship.findMany({
    where: { parentId: user.id },
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const linked = guardianships.filter((g) => g.status === "ACCEPTED");
  const awaiting = guardianships.filter((g) => g.status === "PENDING");

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Your students</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A high-level view of each linked student&apos;s academic health — grades, upcoming
          deadlines, and streaks. Day-to-day assignment detail stays theirs.
        </p>

        <div className="mt-6 space-y-2">
          {linked.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students linked yet.</p>
          ) : (
            linked.map((g) => (
              <Link key={g.id} href={`/parent/${g.student.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{g.student.name}</p>
                      <p className="text-sm text-muted-foreground">{g.student.email}</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {awaiting.length > 0 && (
          <div className="mt-6 space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Awaiting acceptance</h2>
            {awaiting.map((g) => (
              <Card key={g.id}>
                <CardContent className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  {g.student.email} hasn&apos;t accepted your request yet
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Link a student</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestStudentLinkForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
