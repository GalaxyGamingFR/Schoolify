"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateQuizForStudySet,
  generateFlashcardsForStudySet,
  generatePodcastForStudySet,
  type ActionResult,
} from "@/lib/actions/study";
import { Button } from "@/components/ui/button";
import { ListChecks, Layers, Podcast, Loader2 } from "lucide-react";

type Kind = "quiz" | "flashcards" | "podcast";

export function StudyActions({ studySetId }: { studySetId: string }) {
  const [pendingKind, setPendingKind] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function run(kind: Kind, action: () => Promise<ActionResult<string>>, navigate: boolean) {
    setError(null);
    setPendingKind(kind);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          setError(result.error);
        } else if (navigate) {
          router.push(`/study/${studySetId}/${kind}/${result.data}`);
        } else {
          router.refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setPendingKind(null);
      }
    });
  }

  const busy = isPending;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => run("quiz", () => generateQuizForStudySet(studySetId), true)}
        >
          {pendingKind === "quiz" ? <Loader2 className="size-4 animate-spin" /> : <ListChecks className="size-4" />}
          Generate quiz
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => run("flashcards", () => generateFlashcardsForStudySet(studySetId), true)}
        >
          {pendingKind === "flashcards" ? <Loader2 className="size-4 animate-spin" /> : <Layers className="size-4" />}
          Generate flashcards
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => run("podcast", () => generatePodcastForStudySet(studySetId), false)}
        >
          {pendingKind === "podcast" ? <Loader2 className="size-4 animate-spin" /> : <Podcast className="size-4" />}
          Generate audio overview
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
