import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-16">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Schoolify</h1>
        <UserButton />
      </div>

      <Card className="mt-10 w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Welcome, {clerkUser.firstName ?? clerkUser.emailAddresses[0]?.emailAddress}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {dbUser ? (
            <>
              <p>Your account is synced to the database.</p>
              <p className="flex items-center gap-2">
                Role: <Badge variant="secondary">{dbUser.role}</Badge>
              </p>
            </>
          ) : (
            <p>
              Waiting on the Clerk webhook to sync your account — this fills in
              automatically once <code>CLERK_WEBHOOK_SECRET</code> is configured.
            </p>
          )}
          <p className="pt-4">
            This is the Phase 0 foundation. Courses, assignments, and the calendar land in
            Phase 1 — see <code>roadmap.md</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
