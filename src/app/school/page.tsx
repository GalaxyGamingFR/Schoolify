import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { claimSchoolInvites } from "@/lib/actions/school";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { RegisterSchoolForm } from "@/components/register-school-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Schools",
  description: "Register or manage a school on Schoolify.",
};

export default async function SchoolHubPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  // Reconciles any invite sent to this email before the invited person had
  // (or was signed into) a Schoolify account — see claimSchoolInvites.
  await claimSchoolInvites();

  const memberships = await prisma.schoolStaff.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: { school: { select: { id: true, name: true, domain: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Schools</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          For principals and teachers — register a school, invite staff, and create classes
          students join with their school email.
        </p>

        {memberships.length > 0 && (
          <div className="mt-6 space-y-2">
            {memberships.map((m) => (
              <Link key={m.id} href={`/school/${m.school.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{m.school.name}</p>
                      <p className="text-sm text-muted-foreground">{m.school.domain}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{m.role === "PRINCIPAL" ? "Principal" : "Teacher"}</Badge>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Register a school</CardTitle>
          </CardHeader>
          <CardContent>
            <RegisterSchoolForm />
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
