import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { OpportunityFilters } from "@/components/opportunity-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { OpportunitySubject, PrizeTier } from "@prisma/client";

const SUBJECT_LABELS: Record<OpportunitySubject, string> = {
  STEM: "STEM",
  MATH: "Math",
  SCIENCE: "Science",
  COMPUTER_SCIENCE: "Computer Science",
  ENGINEERING: "Engineering",
  BUSINESS: "Business",
  WRITING: "Writing",
  DEBATE: "Debate",
  ARTS: "Arts",
  GENERAL: "General",
};

const PRIZE_LABELS: Record<PrizeTier, string> = {
  RECOGNITION: "Recognition only",
  SMALL: "Small prizes",
  MEDIUM: "Medium prizes",
  LARGE: "Large prizes",
  UNKNOWN: "Varies",
};

export const metadata: Metadata = {
  title: "Opportunities",
  description: "Competitions, fairs, and programs for students.",
};

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; grade?: string; q?: string; scholarship?: string }>;
}) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const subject = params.subject as OpportunitySubject | undefined;
  const grade = params.grade ? Number(params.grade) : undefined;
  const q = params.q?.trim();
  const scholarship = params.scholarship === "1";

  const opportunities = await prisma.opportunity.findMany({
    where: {
      ...(subject ? { subject } : {}),
      ...(scholarship ? { offersScholarship: true } : {}),
      ...(grade
        ? {
            AND: [
              { OR: [{ minGrade: null }, { minGrade: { lte: grade } }] },
              { OR: [{ maxGrade: null }, { maxGrade: { gte: grade } }] },
            ],
          }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { organization: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Competitions, fairs, and programs worth knowing about. Deadlines/prizes vary by year —
          always confirm on the official site before you plan around them.
        </p>

        <div className="mt-6">
          <OpportunityFilters
            subject={subject}
            grade={grade ? String(grade) : undefined}
            q={q}
            scholarship={scholarship}
          />
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {opportunities.length} opportunit{opportunities.length === 1 ? "y" : "ies"}
        </p>

        <div className="mt-2 space-y-3">
          {opportunities.map((o) => (
            <Card key={o.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline"
                  >
                    {o.title}
                    <ExternalLink className="size-3.5 text-muted-foreground" />
                  </a>
                  <div className="flex gap-1.5">
                    {o.offersScholarship && <Badge>Scholarship</Badge>}
                    <Badge variant="secondary">{SUBJECT_LABELS[o.subject]}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <p className="text-muted-foreground">
                  {o.organization}
                  {o.minGrade || o.maxGrade
                    ? ` · Grades ${o.minGrade ?? "any"}–${o.maxGrade ?? "any"}`
                    : ""}
                </p>
                <p>{o.description}</p>
                <p className="text-muted-foreground">{o.deadlineNote}</p>
                <p className="text-muted-foreground">
                  {PRIZE_LABELS[o.prizeTier]}
                  {o.prizeNote ? ` — ${o.prizeNote}` : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
