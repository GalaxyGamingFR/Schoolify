import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo className="size-12 rounded-xl text-xl" />
      <h1 className="text-5xl font-bold tracking-tight">404</h1>
      <p className="max-w-sm text-muted-foreground">
        This page doesn&apos;t exist — it may have moved, or the link might be wrong.
      </p>
      <Button render={<Link href="/">Back to Schoolify</Link>} />
    </main>
  );
}
