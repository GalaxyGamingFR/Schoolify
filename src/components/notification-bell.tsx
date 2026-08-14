"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";

const POLL_INTERVAL_MS = 20000;

export function NotificationBell() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const c = await getUnreadNotificationCount();
      if (!cancelled) setCount(c);
    }
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label={count ? `Notifications, ${count} unread` : "Notifications"}
      className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Bell className="size-4" />
      {!!count && (
        <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
