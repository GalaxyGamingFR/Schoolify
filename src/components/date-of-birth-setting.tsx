"use client";

import { useState, useTransition } from "react";
import { updateDateOfBirth } from "@/lib/actions/settings";
import { DateOfBirthPicker } from "@/components/date-of-birth-picker";
import { Button } from "@/components/ui/button";

export function DateOfBirthSetting({ initial }: { initial: string | null }) {
  const [value, setValue] = useState(initial ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <DateOfBirthPicker
        value={value}
        onChange={(v) => {
          setValue(v);
          setSaved(false);
        }}
        disabled={isPending}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending || !value || value === initial}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await updateDateOfBirth(value);
                setSaved(true);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong");
              }
            });
          }}
        >
          Save
        </Button>
        {saved && <span className="text-sm text-emerald-500">Saved.</span>}
      </div>
    </div>
  );
}
