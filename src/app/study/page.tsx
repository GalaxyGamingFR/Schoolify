import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { NewStudySetForm } from "@/components/new-study-set-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Study",
  description: "Turn notes, documents, and links into AI-generated study material.",
};

export default async function StudyPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const studySets = await prisma.studySet.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">AI Study</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste notes, upload a document, or drop in a link — get AI-generated study notes you can
          edit, ask questions about, and turn into a quiz, flashcards, or an audio overview.
        </p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">New study set</CardTitle>
          </CardHeader>
          <CardContent>
            <NewStudySetForm />
          </CardContent>
        </Card>

        {studySets.length > 0 && (
          <div className="mt-8 space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Your study sets</h2>
            {studySets.map((s) => (
              <Link key={s.id} href={`/study/${s.id}`}>
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {s.status === "PROCESSING" || s.status === "PENDING" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <BookOpen className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(s.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    {s.status === "FAILED" && (
                      <Badge variant="destructive" className="text-xs">
                        Failed
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
