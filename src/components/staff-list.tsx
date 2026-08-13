"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeStaff } from "@/lib/actions/school";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type StaffMember = {
  id: string;
  email: string;
  role: "PRINCIPAL" | "TEACHER";
  status: "INVITED" | "ACTIVE";
  name: string | null;
};

export function StaffList({ staff }: { staff: StaffMember[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-2">
      {staff.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
          <div>
            <p className="font-medium">{s.name ?? s.email}</p>
            {s.name && <p className="text-muted-foreground">{s.email}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{s.role === "PRINCIPAL" ? "Principal" : "Teacher"}</Badge>
            {s.status === "INVITED" && <Badge variant="outline">Invited</Badge>}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remove"
              disabled={isPending}
              onClick={() => {
                if (!confirm(`Remove ${s.name ?? s.email} from staff?`)) return;
                startTransition(async () => {
                  await removeStaff(s.id);
                  router.refresh();
                });
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
