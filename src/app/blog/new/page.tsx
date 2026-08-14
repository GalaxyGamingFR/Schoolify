import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { AppNav } from "@/components/app-nav";
import { PostForm } from "@/components/post-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "New Post",
  description: "Publish a new blog post.",
};

export default async function NewPostPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "ADMIN") notFound();

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Blog
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">New post</h1>

        <div className="mt-6">
          <PostForm />
        </div>
      </main>
    </div>
  );
}
