"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { reactivateUser, suspendUser, updateUserRole } from "@/lib/actions/admin-users";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldOff, ShieldCheck } from "lucide-react";
import type { Role, UserStatus } from "@prisma/client";

const ROLE_ITEMS = { STUDENT: "Student", PARENT: "Parent", TEACHER: "Teacher", ADMIN: "Admin" };

export function UserDirectoryRow({
  user,
  isSelf,
}: {
  user: { id: string; name: string; email: string; role: Role; status: UserStatus; createdAt: Date };
  isSelf: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            {user.name}
            {isSelf && (
              <Badge variant="secondary" className="text-xs">
                You
              </Badge>
            )}
            {user.status === "SUSPENDED" && (
              <Badge variant="destructive" className="text-xs">
                Suspended
              </Badge>
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user.email} · joined {format(user.createdAt, "MMM d, yyyy")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Select
            value={user.role}
            onValueChange={(v) =>
              startTransition(async () => {
                await updateUserRole(user.id, v as Role);
                router.refresh();
              })
            }
            items={ROLE_ITEMS}
            disabled={isSelf || isPending}
          >
            <SelectTrigger size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {user.status === "SUSPENDED" ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await reactivateUser(user.id);
                  router.refresh();
                })
              }
            >
              <ShieldCheck className="size-4" /> Reactivate
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={isSelf || isPending}
              onClick={() => {
                if (!confirm(`Suspend ${user.name}? They won't be able to sign in until reactivated.`)) return;
                startTransition(async () => {
                  await suspendUser(user.id);
                  router.refresh();
                });
              }}
            >
              <ShieldOff className="size-4" /> Suspend
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
