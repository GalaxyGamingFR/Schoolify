"use client";

import { useState, useTransition } from "react";
import { updateNotificationPreferences } from "@/lib/actions/settings";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type Prefs = {
  notifyOnMessage: boolean;
  notifyOnGuardianship: boolean;
  notifyOnSchoolInvite: boolean;
  notifyOnBroadcast: boolean;
};

const OPTIONS: { key: keyof Prefs; label: string; description: string }[] = [
  { key: "notifyOnMessage", label: "New messages", description: "When someone sends you a direct, group, or class message" },
  { key: "notifyOnGuardianship", label: "Guardian links", description: "Link requests, and when a link is accepted" },
  { key: "notifyOnSchoolInvite", label: "School staff invites", description: "When you're added as staff at a school" },
  { key: "notifyOnBroadcast", label: "Platform announcements", description: "Broadcasts sent by Schoolify admins" },
];

export function NotificationPreferencesForm({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {OPTIONS.map((opt) => (
        <label key={opt.key} className="flex items-start gap-2.5">
          <Checkbox
            checked={prefs[opt.key]}
            onCheckedChange={(checked) => {
              setSaved(false);
              setPrefs((p) => ({ ...p, [opt.key]: !!checked }));
            }}
            className="mt-0.5"
          />
          <span className="text-sm">
            <span className="font-medium">{opt.label}</span>
            <span className="block text-xs text-muted-foreground">{opt.description}</span>
          </span>
        </label>
      ))}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await updateNotificationPreferences(prefs);
              setSaved(true);
            })
          }
        >
          Save preferences
        </Button>
        {saved && <span className="text-sm text-emerald-500">Saved.</span>}
      </div>
    </div>
  );
}
