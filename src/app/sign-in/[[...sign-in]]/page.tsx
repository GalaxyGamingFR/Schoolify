import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Schoolify account.",
};

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center py-16">
      <SignIn />
    </main>
  );
}
