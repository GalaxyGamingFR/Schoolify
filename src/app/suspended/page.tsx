import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Account Suspended",
  description: "Your Schoolify account has been suspended.",
};

// Deliberately doesn't call getCurrentDbUser() -- that's exactly the
// function that redirects here, so calling it again risks a loop. This
// page needs no user data at all.
export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo className="size-12 rounded-xl text-lg" />
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Account suspended</h1>
      <Card className="mt-6 max-w-sm">
        <CardContent className="py-4 text-sm text-muted-foreground">
          Your account has been suspended by a Schoolify admin. If you think this is a mistake,
          email{" "}
          <a href="mailto:therealtariqkhalif@gmail.com" className="text-primary hover:underline">
            therealtariqkhalif@gmail.com
          </a>{" "}
          and we&apos;ll look into it.
        </CardContent>
      </Card>
    </div>
  );
}
