import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { UserDirectoryFilters } from "@/components/user-directory-filters";
import { UserDirectoryRow } from "@/components/user-directory-row";
import { ArrowLeft } from "lucide-react";
import type { Prisma, Role, UserStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "User Directory",
  description: "Search, filter, and manage Schoolify accounts.",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "ADMIN") notFound();

  const { q, role, status } = await searchParams;

  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (role && role !== "ALL") where.role = role as Role;
  if (status && status !== "ALL") where.status = status as UserStatus;

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href="/moderation" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Admin
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">User directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {users.length} account{users.length === 1 ? "" : "s"}
          {users.length === 100 ? " (showing first 100 — narrow your search)" : ""}
        </p>

        <div className="mt-4">
          <UserDirectoryFilters q={q} role={role} status={status} />
        </div>

        <div className="mt-4 space-y-2">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts match.</p>
          ) : (
            users.map((u) => <UserDirectoryRow key={u.id} user={u} isSelf={u.id === user.id} />)
          )}
        </div>
      </main>
    </div>
  );
}
