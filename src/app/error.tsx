"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";

// Catches any error thrown while rendering a page or server action beneath
// the root layout -- effectively every real page in the app, in one file,
// via Next's file-based error boundary convention rather than one per
// route. Reports to Sentry with a full stack trace before showing the
// reset button.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <Logo className="size-12 rounded-xl text-lg" />
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Something went wrong</h1>
      <Card className="mt-6 max-w-sm">
        <CardContent className="space-y-4 py-4 text-sm text-muted-foreground">
          <p>We&apos;ve been notified and are looking into it. Trying again usually fixes it.</p>
          <Button onClick={() => reset()}>
            <RotateCcw className="size-4" /> Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
