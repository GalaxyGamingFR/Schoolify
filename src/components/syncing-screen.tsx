"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAccountSynced } from "@/lib/actions/onboarding";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 1500;
const TIP_INTERVAL_MS = 3500;

const TIPS = [
  "Type a task into Today and hit Enter — no course setup needed to start tracking your work.",
  "Grade categories support dropping your lowest score, extra credit, and custom curves.",
  "The Grade Optimizer tells you exactly what score you need on an upcoming assignment to hit a target grade.",
  "Turn on dark, light, or system theme any time from the moon icon in the nav.",
  "Parents and guardians only see high-level grades and deadlines — never your day-to-day task list.",
  "Messaging is limited to classmates, teachers, and linked guardians — never open to the whole platform.",
];

// The Clerk user.created webhook usually lands within a couple seconds, but
// there's nothing to show until it does -- the eventual page differs by
// route (dashboard, settings, etc.), so a rotating-tip screen fits better
// than a content skeleton that would have to guess a shape. Polls in the
// background and refreshes itself the moment the row exists, so nobody
// has to sit here and manually hit refresh.
export function SyncingScreen() {
  const [tipIndex, setTipIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const poll = setInterval(async () => {
      if (await isAccountSynced()) {
        clearInterval(poll);
        router.refresh();
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(poll);
  }, [router]);

  useEffect(() => {
    const rotate = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setTipIndex((i) => (i + 1) % TIPS.length);
        setFading(false);
      }, 200);
    }, TIP_INTERVAL_MS);
    return () => clearInterval(rotate);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <Logo className="size-10 animate-pulse rounded-xl text-base" />
      <h1 className="mt-4 text-lg font-semibold">Setting up your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">This only takes a moment.</p>
      <p
        className={cn(
          "mt-8 max-w-sm text-sm text-muted-foreground transition-opacity duration-200",
          fading ? "opacity-0" : "opacity-100",
        )}
      >
        <span className="font-medium text-foreground">Tip:</span> {TIPS[tipIndex]}
      </p>
    </div>
  );
}
