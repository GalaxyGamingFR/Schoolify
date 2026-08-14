import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description: "Announcements and posts from Schoolify.",
};

export default async function BlogPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const posts = await prisma.blogPost.findMany({
    include: { author: { select: { name: true } }, _count: { select: { comments: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          {user.role === "ADMIN" && (
            <Button size="sm" render={<Link href="/blog/new"><Plus className="size-4" /> New post</Link>} />
          )}
        </div>

        <div className="mt-6 space-y-2">
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing posted yet.</p>
          ) : (
            posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="py-4">
                    <p className="font-medium">{p.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{p.body}</p>
                    <p className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {p.author.name} · {formatDistanceToNow(p.createdAt, { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="size-3.5" /> {p._count.comments}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
