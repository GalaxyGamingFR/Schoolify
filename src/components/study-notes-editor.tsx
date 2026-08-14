"use client";

import { useEffect, useRef, useState } from "react";
import { updateStudyNotes } from "@/lib/actions/study";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 1200;

export function StudyNotesEditor({ studySetId, initialNotes }: { studySetId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChange(value: string) {
    setNotes(value);
    setStatus("saving");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await updateStudyNotes(studySetId, value);
      setStatus("saved");
    }, SAVE_DEBOUNCE_MS);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Notes</h2>
        <span
          className={cn(
            "text-xs text-muted-foreground transition-opacity",
            status === "idle" ? "opacity-0" : "opacity-100",
          )}
        >
          {status === "saving" ? "Saving…" : "Saved"}
        </span>
      </div>
      <Textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        rows={20}
        className="font-mono text-sm leading-relaxed"
        placeholder="Your generated notes will appear here — edit freely."
      />
    </div>
  );
}
