import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RedirectIfSignedIn } from "@/components/redirect-if-signed-in";

// Deliberately no server-side currentUser() check here — that made every
// visit dynamic (Cache-Control: no-store), which both slowed first paint
// (fresh server round-trip every time) and disabled the back/forward cache
// entirely. The redirect for already-signed-in visitors now happens
// client-side (RedirectIfSignedIn) so this page itself stays static and
// cacheable — see roadmap.md.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <RedirectIfSignedIn />
      <h1 className="text-4xl font-semibold tracking-tight">Schoolify</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Make school easier, organized, and genuinely engaging.
      </p>
      <div className="flex gap-4">
        <Button render={<Link href="/sign-up">Get started</Link>} />
        <Button variant="outline" render={<Link href="/sign-in">Sign in</Link>} />
      </div>
    </main>
  );
}
