"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Unlink } from "lucide-react";
import { removeGuardianship } from "@/lib/actions/guardianship";

export function RemoveGuardianshipButton({ guardianshipId }: { guardianshipId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Unlink this student? You'll lose access to their academic health view.")) return;
        startTransition(async () => {
          await removeGuardianship(guardianshipId);
          router.push("/parent");
        });
      }}
    >
      <Unlink className="size-4" /> Unlink
    </Button>
  );
}
