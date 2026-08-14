import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { PostForm } from "@/components/post-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Edit Post",
  description: "Edit a blog post.",
};

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "ADMIN") notFound();

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href={`/blog/${post.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {post.title}
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Edit post</h1>

        <div className="mt-6">
          <PostForm post={{ id: post.id, title: post.title, body: post.body }} />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
