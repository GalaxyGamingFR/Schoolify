import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { OnboardingForm } from "@/components/onboarding-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OnboardingPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  if (user.onboardingCompletedAt) redirect(user.role === "PARENT" ? "/parent" : "/dashboard");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Schoolify</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tell us who&apos;s using this account so we can set things up right.
          </p>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </main>
  );
}
