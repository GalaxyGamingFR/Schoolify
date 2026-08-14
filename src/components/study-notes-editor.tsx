"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { updateStudyNotes } from "@/lib/actions/study";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 1200;

export function StudyNotesEditor({ studySetId, initialNotes }: { studySetId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [editing, setEditing] = useState(false);
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
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs text-muted-foreground transition-opacity",
              status === "idle" ? "opacity-0" : "opacity-100",
            )}
          >
            {status === "saving" ? "Saving…" : "Saved"}
          </span>
          <Button variant="outline" size="xs" onClick={() => setEditing((v) => !v)}>
            {editing ? (
              <>
                <Eye className="size-3.5" /> Preview
              </>
            ) : (
              <>
                <Pencil className="size-3.5" /> Edit
              </>
            )}
          </Button>
        </div>
      </div>

      {editing ? (
        <Textarea
          value={notes}
          onChange={(e) => handleChange(e.target.value)}
          rows={20}
          className="font-mono text-sm leading-relaxed"
          placeholder="Your generated notes will appear here — edit freely."
          autoFocus
        />
      ) : notes ? (
        <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border p-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
        </div>
      ) : (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          No notes yet — click Edit to write some.
        </p>
      )}
    </div>
  );
}
