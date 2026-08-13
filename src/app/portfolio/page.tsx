import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { NewActivityForm } from "@/components/new-activity-form";
import { DeleteActivityButton } from "@/components/delete-activity-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import type { ActivityCategory } from "@prisma/client";

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  CLUB: "Club",
  VOLUNTEER: "Volunteer",
  LEADERSHIP: "Leadership",
  SUMMER_PROGRAM: "Summer program",
  AWARD: "Award",
  WORK: "Work",
  OTHER: "Other",
};

export default async function PortfolioPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const activities = await prisma.activity.findMany({
    where: { userId: user.id },
    orderBy: [{ endDate: "desc" }, { startDate: "desc" }],
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          {activities.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              render={
                <Link href="/portfolio/resume">
                  <FileText className="size-4" /> View as resume
                </Link>
              }
            />
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Log clubs, volunteering, leadership roles, summer programs, and awards — it builds into
          a formatted resume view you can print.
        </p>

        <div className="mt-6">
          <NewActivityForm />
        </div>

        <div className="mt-6 space-y-2">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing logged yet — add your first above.</p>
          ) : (
            activities.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-start justify-between gap-2 py-3">
                  <div className="text-sm">
                    <p className="font-medium">
                      {a.title}
                      {a.role && <span className="text-muted-foreground"> — {a.role}</span>}
                    </p>
                    <p className="text-muted-foreground">
                      {a.organization}
                      {a.organization && " · "}
                      {a.startDate && format(a.startDate, "MMM yyyy")}
                      {a.startDate && (a.endDate ? ` – ${format(a.endDate, "MMM yyyy")}` : " – present")}
                      {a.hoursTotal ? ` · ${a.hoursTotal} hrs` : ""}
                    </p>
                    {a.description && <p className="mt-1">{a.description}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary">{CATEGORY_LABELS[a.category]}</Badge>
                    <DeleteActivityButton activityId={a.id} />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
