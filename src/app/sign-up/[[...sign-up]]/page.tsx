import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Schoolify account.",
};

export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center py-16">
      <SignUp />
    </main>
  );
}
