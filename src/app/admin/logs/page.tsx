import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { getLogEntries } from "@/lib/actions/admin-logs";
import { AppNav } from "@/components/app-nav";
import { LiveLogConsole } from "@/components/live-log-console";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "System Logs",
  description: "A real audit trail of platform activity and admin actions.",
};

export default async function AdminLogsPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "ADMIN") notFound();

  const initialEntries = await getLogEntries();

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href="/moderation" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Admin
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">System logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real platform activity — signups, reports, schools, broadcasts, and admin actions,
          streaming in as they happen. No simulated data.
        </p>

        <LiveLogConsole initialEntries={initialEntries} />
      </main>
    </div>
  );
}
