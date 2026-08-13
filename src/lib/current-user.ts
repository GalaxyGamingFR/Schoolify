import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Resolves the signed-in Clerk user to our own User row. Returns null when
 * the Clerk webhook hasn't synced the row yet (a few seconds after
 * first sign-in) rather than throwing — callers show a "still syncing"
 * state instead of erroring.
 */
export async function getCurrentDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  return dbUser;
}
