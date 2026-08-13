"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerSchool } from "@/lib/actions/school";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function RegisterSchoolForm() {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!name.trim() || !domain.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const school = await registerSchool({ name, domain });
        router.push(`/school/${school.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="school-name">School name</Label>
        <Input id="school-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Lincoln High School" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="school-domain">School email domain</Label>
        <Input
          id="school-domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="lincolnhigh.edu"
        />
        <p className="text-xs text-muted-foreground">
          Your own account email must be on this domain — that&apos;s what proves you belong
          there. Teachers and students join the same way.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button disabled={!name.trim() || !domain.trim() || isPending} onClick={submit}>
        Register school
      </Button>
    </div>
  );
}
