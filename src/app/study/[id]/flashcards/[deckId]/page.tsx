import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { FlashcardViewer } from "@/components/flashcard-viewer";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Flashcards" };

export default async function StudyFlashcardsPage({ params }: { params: Promise<{ id: string; deckId: string }> }) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const { id, deckId } = await params;
  const deck = await prisma.studyFlashcardDeck.findUnique({
    where: { id: deckId },
    include: { cards: true, studySet: { select: { ownerId: true } } },
  });
  if (!deck || deck.studySetId !== id || deck.studySet.ownerId !== user.id) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href={`/study/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to study set
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{deck.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{deck.cards.length} cards — click a card to flip it</p>

        <div className="mt-6">
          <FlashcardViewer cards={deck.cards} />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
