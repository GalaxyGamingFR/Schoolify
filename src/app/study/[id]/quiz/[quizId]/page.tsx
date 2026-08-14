import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { QuizPlayer } from "@/components/quiz-player";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Quiz" };

export default async function StudyQuizPage({ params }: { params: Promise<{ id: string; quizId: string }> }) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const { id, quizId } = await params;
  const quiz = await prisma.studyQuiz.findUnique({
    where: { id: quizId },
    include: { questions: true, studySet: { select: { ownerId: true } } },
  });
  if (!quiz || quiz.studySetId !== id || quiz.studySet.ownerId !== user.id) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href={`/study/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to study set
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{quiz.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{quiz.questions.length} questions</p>

        <div className="mt-6">
          <QuizPlayer questions={quiz.questions} />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
