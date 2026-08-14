"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, X, RotateCcw } from "lucide-react";

type Question = {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string | null;
};

export function QuizPlayer({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const score = questions.filter((q) => answers[q.id] === q.correctIndex).length;

  function pick(questionId: string, choiceIndex: number) {
    if (finished) return;
    setAnswers((prev) => ({ ...prev, [questionId]: choiceIndex }));
  }

  function reset() {
    setAnswers({});
    setFinished(false);
  }

  if (finished) {
    return (
      <Card>
        <CardContent className="space-y-4 py-6 text-center">
          <p className="text-3xl font-bold tabular-nums">
            {score}/{questions.length}
          </p>
          <p className="text-sm text-muted-foreground">
            {score === questions.length ? "Perfect score!" : "Keep reviewing the notes and try again."}
          </p>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="size-4" /> Retake quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q, i) => {
        const picked = answers[q.id];
        return (
          <Card key={q.id}>
            <CardContent className="space-y-3 py-4">
              <p className="text-sm font-medium">
                {i + 1}. {q.question}
              </p>
              <div className="space-y-1.5">
                {q.choices.map((choice, ci) => {
                  const isPicked = picked === ci;
                  const isCorrect = ci === q.correctIndex;
                  const revealed = picked !== undefined;
                  return (
                    <button
                      key={ci}
                      type="button"
                      disabled={revealed}
                      onClick={() => pick(q.id, ci)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                        !revealed && "hover:border-primary/50 hover:bg-muted/50",
                        revealed && isCorrect && "border-emerald-500/50 bg-emerald-500/10",
                        revealed && isPicked && !isCorrect && "border-red-500/50 bg-red-500/10",
                        revealed && !isPicked && !isCorrect && "opacity-50",
                      )}
                    >
                      {choice}
                      {revealed && isCorrect && <Check className="size-4 shrink-0 text-emerald-500" />}
                      {revealed && isPicked && !isCorrect && <X className="size-4 shrink-0 text-red-500" />}
                    </button>
                  );
                })}
              </div>
              {picked !== undefined && q.explanation && (
                <p className="text-xs text-muted-foreground">{q.explanation}</p>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Button disabled={answeredCount < questions.length} onClick={() => setFinished(true)}>
        See results ({answeredCount}/{questions.length} answered)
      </Button>
    </div>
  );
}
