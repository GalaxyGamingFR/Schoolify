"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptGuardianship, declineGuardianship } from "@/lib/actions/guardianship";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PendingRequest = { id: string; parentName: string; parentEmail: string };

/** Requests a parent sent — the student must explicitly accept before that parent gets any access. */
export function GuardianRequestsCard({ requests }: { requests: PendingRequest[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (requests.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Guardian requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 text-sm">
            <div>
              <p className="font-medium">{r.parentName}</p>
              <p className="text-muted-foreground">{r.parentEmail}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => startTransition(async () => {
                  await acceptGuardianship(r.id);
                  router.refresh();
                })}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => startTransition(async () => {
                  await declineGuardianship(r.id);
                  router.refresh();
                })}
              >
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
