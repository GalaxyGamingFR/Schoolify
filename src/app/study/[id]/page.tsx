import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { StudyNotesEditor } from "@/components/study-notes-editor";
import { StudyActions } from "@/components/study-actions";
import { StudyChat } from "@/components/study-chat";
import { DeleteStudySetButton } from "@/components/delete-study-set-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ListChecks, Layers, Podcast, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Study set",
  description: "AI-generated study notes, quizzes, flashcards, and audio overviews.",
};

export default async function StudySetPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const { id } = await params;
  const studySet = await prisma.studySet.findUnique({
    where: { id },
    include: {
      sources: { select: { type: true, title: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 100 },
      quizzes: { select: { id: true, title: true, createdAt: true, _count: { select: { questions: true } } } },
      decks: { select: { id: true, title: true, createdAt: true, _count: { select: { cards: true } } } },
      podcasts: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!studySet || studySet.ownerId !== user.id) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Link href="/study" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> AI Study
        </Link>

        <div className="mt-2 flex items-start justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{studySet.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              From {studySet.sources.map((s) => s.title).join(", ")} · {format(studySet.createdAt, "MMM d, yyyy")}
            </p>
          </div>
          <DeleteStudySetButton studySetId={studySet.id} />
        </div>

        {studySet.status === "FAILED" && (
          <Card className="mt-6 border-destructive/50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="size-5 shrink-0 text-destructive" />
              <p className="text-sm">
                Generating notes failed: {studySet.error ?? "unknown error"}. Delete this set and try again.
              </p>
            </CardContent>
          </Card>
        )}

        {(studySet.status === "PENDING" || studySet.status === "PROCESSING") && (
          <Card className="mt-6">
            <CardContent className="py-4 text-sm text-muted-foreground">Still generating notes — refresh in a moment.</CardContent>
          </Card>
        )}

        {studySet.status === "READY" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <StudyNotesEditor studySetId={studySet.id} initialNotes={studySet.notes ?? ""} />

              <div>
                <h2 className="mb-1.5 text-sm font-semibold text-muted-foreground">Generate from these notes</h2>
                <StudyActions studySetId={studySet.id} />
              </div>

              {(studySet.quizzes.length > 0 || studySet.decks.length > 0 || studySet.podcasts.length > 0) && (
                <div className="space-y-2">
                  {studySet.quizzes.map((q) => (
                    <Link key={q.id} href={`/study/${studySet.id}/quiz/${q.id}`}>
                      <Card className="transition-colors hover:bg-muted/40">
                        <CardContent className="flex items-center gap-3 py-3">
                          <ListChecks className="size-4 shrink-0 text-primary" />
                          <p className="flex-1 text-sm font-medium">{q.title}</p>
                          <Badge variant="secondary" className="text-xs">
                            {q._count.questions} questions
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {studySet.decks.map((d) => (
                    <Link key={d.id} href={`/study/${studySet.id}/flashcards/${d.id}`}>
                      <Card className="transition-colors hover:bg-muted/40">
                        <CardContent className="flex items-center gap-3 py-3">
                          <Layers className="size-4 shrink-0 text-primary" />
                          <p className="flex-1 text-sm font-medium">{d.title}</p>
                          <Badge variant="secondary" className="text-xs">
                            {d._count.cards} cards
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {studySet.podcasts.map((p) => (
                    <Card key={p.id}>
                      <CardContent className="space-y-2 py-3">
                        <div className="flex items-center gap-3">
                          <Podcast className="size-4 shrink-0 text-primary" />
                          <p className="flex-1 text-sm font-medium">{p.title}</p>
                          {p.status !== "READY" && (
                            <Badge variant={p.status === "FAILED" ? "destructive" : "secondary"} className="text-xs">
                              {p.status === "FAILED" ? "Failed" : "Generating…"}
                            </Badge>
                          )}
                        </div>
                        {p.audioUrl && <audio controls src={p.audioUrl} className="w-full" />}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="h-[600px] lg:h-auto">
              <StudyChat
                studySetId={studySet.id}
                initialMessages={studySet.messages.map((m) => ({
                  id: m.id,
                  role: m.role as "user" | "assistant",
                  body: m.body,
                }))}
              />
            </div>
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
