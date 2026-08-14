import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { getNotifications } from "@/lib/actions/notifications";
import { AppNav } from "@/components/app-nav";
import { NotificationList } from "@/components/notification-list";

export const metadata: Metadata = {
  title: "Notifications",
  description: "New messages, guardian link requests, and other activity.",
};

export default async function NotificationsPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const notifications = await getNotifications();

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          New messages, guardian link requests, and other activity that involves you.
        </p>

        <div className="mt-6">
          <NotificationList
            notifications={notifications.map((n) => ({
              id: n.id,
              type: n.type,
              title: n.title,
              body: n.body,
              link: n.link,
              readAt: n.readAt?.toISOString() ?? null,
              createdAt: n.createdAt.toISOString(),
            }))}
          />
        </div>
      </main>
    </div>
  );
}
