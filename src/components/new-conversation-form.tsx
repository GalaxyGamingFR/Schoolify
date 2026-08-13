"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startDirectConversation, startGroupConversation } from "@/lib/actions/messaging";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function NewConversationForm({
  contacts,
}: {
  contacts: { id: string; name: string; relation: string }[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    if (selected.size === 0) return;
    setError(null);
    startTransition(async () => {
      try {
        const conversation =
          selected.size === 1
            ? await startDirectConversation([...selected][0])
            : await startGroupConversation({ name: groupName, participantIds: [...selected] });
        router.push(`/messages/${conversation.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {contacts.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm">
            <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} />
            {c.name}
            <Badge variant="secondary" className="text-xs">
              {c.relation}
            </Badge>
          </label>
        ))}
      </div>

      {selected.size > 1 && (
        <div className="space-y-1">
          <Label htmlFor="group-name">Group name</Label>
          <Input
            id="group-name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Study group"
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button disabled={selected.size === 0 || isPending} onClick={submit}>
        {selected.size > 1 ? "Start group chat" : "Send message"}
      </Button>
    </div>
  );
}
