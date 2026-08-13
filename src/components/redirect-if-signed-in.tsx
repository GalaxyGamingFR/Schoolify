"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

/** Renders nothing — just redirects an already-signed-in visitor away from the marketing page. */
export function RedirectIfSignedIn() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) router.replace("/dashboard");
  }, [isSignedIn, router]);

  return null;
}
