import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/print-button";

export default async function ResumePage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const activities = await prisma.activity.findMany({
    where: { userId: user.id },
    orderBy: [{ endDate: "desc" }, { startDate: "desc" }],
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="print:hidden">
        <AppNav />
      </div>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/portfolio" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Portfolio
          </Link>
          <PrintButton />
        </div>

        <div className="mt-6 print:mt-0">
          <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>

          {activities.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Nothing logged yet — add activities on the Portfolio page first.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {activities.map((a) => (
                <div key={a.id} className="border-b pb-3 last:border-none">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium">
                      {a.title}
                      {a.role && <span className="text-muted-foreground"> — {a.role}</span>}
                    </p>
                    <p className="shrink-0 text-sm text-muted-foreground">
                      {a.startDate && format(a.startDate, "MMM yyyy")}
                      {a.startDate && (a.endDate ? ` – ${format(a.endDate, "MMM yyyy")}` : " – present")}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {a.organization}
                    {a.hoursTotal ? ` · ${a.hoursTotal} hours` : ""}
                  </p>
                  {a.description && <p className="mt-1 text-sm">{a.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
