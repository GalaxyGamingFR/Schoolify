import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Resolves the signed-in Clerk user to our own User row. Returns null when
 * the Clerk webhook hasn't synced the row yet (a few seconds after
 * first sign-in) rather than throwing — callers show a "still syncing"
 * state instead of erroring.
 *
 * A suspended account is redirected to /suspended right here, once, rather
 * than adding a status check to every one of the ~40 call sites (every
 * page and server action already calls this first thing) — `redirect()`
 * is safe to call from inside a nested async function during a Server
 * Component render or Server Action, not just at the top level.
 */
export async function getCurrentDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (dbUser?.status === "SUSPENDED") redirect("/suspended");

  return dbUser;
}
