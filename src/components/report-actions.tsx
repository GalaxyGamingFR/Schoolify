"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { dismissReport, removeReportedMessage } from "@/lib/actions/moderation";
import { Button } from "@/components/ui/button";

export function ReportActions({ reportId, alreadyRemoved }: { reportId: string; alreadyRemoved: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex gap-2">
      {!alreadyRemoved && (
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await removeReportedMessage(reportId);
              router.refresh();
            })
          }
        >
          Remove message
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await dismissReport(reportId);
            router.refresh();
          })
        }
      >
        Dismiss
      </Button>
    </div>
  );
}
