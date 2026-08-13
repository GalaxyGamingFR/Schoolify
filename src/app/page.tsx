import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const user = await currentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Schoolify</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Make school easier, organized, and genuinely engaging.
      </p>
      <div className="flex gap-4">
        <Button render={<Link href="/sign-up">Get started</Link>} />
        <Button variant="outline" render={<Link href="/sign-in">Sign in</Link>} />
      </div>
    </div>
  );
}
