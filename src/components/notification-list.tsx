"use client";

import { useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, GraduationCap, Megaphone, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@prisma/client";

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  MESSAGE: MessageSquare,
  GUARDIANSHIP_REQUEST: Users,
  GUARDIANSHIP_ACCEPTED: Users,
  SCHOOL_INVITE: GraduationCap,
  BROADCAST: Megaphone,
};

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string;
  readAt: string | null;
  createdAt: string;
};

export function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
  const [isPending, startTransition] = useTransition();
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => markAllNotificationsRead())}
          >
            Mark all read
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet — you&apos;ll see activity here as it happens.</p>
        ) : (
          notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type];
            const unread = !n.readAt;
            return (
              <Link
                key={n.id}
                href={n.link}
                onClick={() => {
                  if (unread) startTransition(() => markNotificationRead(n.id));
                }}
              >
                <Card className={cn("transition-colors hover:bg-muted/50", unread && "border-primary/50")}>
                  <CardContent className="flex items-start gap-3 py-3">
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        {n.title}
                        {unread && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                      </p>
                      {n.body && <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.body}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
