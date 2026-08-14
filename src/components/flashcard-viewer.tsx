"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

type Card = { id: string; front: string; back: string };

export function FlashcardViewer({ cards }: { cards: Card[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => Math.max(0, Math.min(cards.length - 1, i + delta)));
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex aspect-[3/2] w-full max-w-md cursor-pointer items-center justify-center rounded-xl border bg-card p-8 text-center shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        <p className={cn("text-lg", flipped ? "text-muted-foreground" : "font-medium")}>
          {flipped ? card.back : card.front}
        </p>
      </button>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" disabled={index === 0} onClick={() => go(-1)} aria-label="Previous card">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setFlipped((f) => !f)}>
          <RotateCw className="size-4" /> Flip
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={index === cards.length - 1}
          onClick={() => go(1)}
          aria-label="Next card"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <p className="text-xs tabular-nums text-muted-foreground">
        {index + 1} / {cards.length}
      </p>
    </div>
  );
}
