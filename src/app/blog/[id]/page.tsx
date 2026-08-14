import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { BlogCommentsSection } from "@/components/blog-comments-section";
import { DeletePostButton } from "@/components/delete-post-button";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";

export const metadata: Metadata = {
  title: "Post",
  description: "A Schoolify blog post.",
};

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      comments: {
        where: { parentId: null },
        include: {
          author: { select: { name: true } },
          reactions: { select: { emoji: true, userId: true } },
          replies: {
            include: {
              author: { select: { name: true } },
              reactions: { select: { emoji: true, userId: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!post) notFound();

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Blog
        </Link>

        <div className="mt-2 flex items-start justify-between gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
          {isAdmin && (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Edit post"
                render={<Link href={`/blog/${post.id}/edit`}><Pencil className="size-4" /></Link>}
              />
              <DeletePostButton postId={post.id} />
            </div>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {post.author.name} · {format(post.createdAt, "MMM d, yyyy")}
        </p>

        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>

        <BlogCommentsSection
          postId={post.id}
          initialComments={post.comments}
          currentUserId={user.id}
          currentUserName={user.name}
          isAdmin={isAdmin}
        />
      </main>
      <AppFooter />
    </div>
  );
}
