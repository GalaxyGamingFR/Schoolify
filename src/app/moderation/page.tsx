import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { ReportActions } from "@/components/report-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Moderation",
  description: "Review reported messages.",
};

export default async function ModerationPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  // ADMIN is a platform-trust role with no self-service path to acquire it
  // (not offered in onboarding) — it's set directly in the database by a
  // real operator. See roadmap.md.
  if (user.role !== "ADMIN") notFound();

  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    include: {
      message: { include: { sender: { select: { name: true, email: true } } } },
      reporter: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Moderation queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">{reports.length} open report{reports.length === 1 ? "" : "s"}</p>

        <div className="mt-6 space-y-3">
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing to review.</p>
          ) : (
            reports.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Reported by {r.reporter.name}</span>
                    <Badge variant="outline">{format(r.createdAt, "MMM d, h:mm a")}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">Reason: {r.reason}</p>
                  <div className="rounded-md border bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">
                      {r.message.sender.name} ({r.message.sender.email})
                      {r.message.deletedAt && " · already removed"}
                    </p>
                    <p className="mt-1">{r.message.body}</p>
                  </div>
                  <ReportActions reportId={r.id} alreadyRemoved={!!r.message.deletedAt} />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
