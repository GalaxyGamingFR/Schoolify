"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import { enforceRateLimit, sensitiveActionLimiter } from "@/lib/rate-limit";
import { REACTION_EMOJI } from "@/lib/blog-reactions";

async function requireAdmin() {
  const user = await getCurrentDbUser();
  if (!user || user.role !== "ADMIN") throw new Error("Admin only");
  return user;
}

export async function createPost(input: { title: string; body: string }) {
  const admin = await requireAdmin();
  if (!input.title.trim() || !input.body.trim()) throw new Error("Title and body are required");

  const post = await prisma.blogPost.create({
    data: { authorId: admin.id, title: input.title.trim(), body: input.body.trim() },
  });

  revalidatePath("/blog");
  return post;
}

export async function updatePost(postId: string, input: { title: string; body: string }) {
  await requireAdmin();
  if (!input.title.trim() || !input.body.trim()) throw new Error("Title and body are required");

  await prisma.blogPost.update({
    where: { id: postId },
    data: { title: input.title.trim(), body: input.body.trim() },
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${postId}`);
}

export async function deletePost(postId: string) {
  await requireAdmin();
  await prisma.blogPost.delete({ where: { id: postId } });
  revalidatePath("/blog");
}

export async function createComment(input: { postId: string; body: string; parentId?: string }) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  await enforceRateLimit(sensitiveActionLimiter, user.id);
  if (!input.body.trim()) throw new Error("Comment can't be empty");

  const post = await prisma.blogPost.findUnique({ where: { id: input.postId } });
  if (!post) throw new Error("Post not found");

  if (input.parentId) {
    const parent = await prisma.blogComment.findUnique({ where: { id: input.parentId } });
    if (!parent || parent.postId !== input.postId) throw new Error("Comment not found");
    if (parent.parentId) throw new Error("Can't reply to a reply");
  }

  const comment = await prisma.blogComment.create({
    data: {
      postId: input.postId,
      authorId: user.id,
      body: input.body.trim(),
      parentId: input.parentId,
    },
  });

  revalidatePath(`/blog/${input.postId}`);
  return comment;
}

export async function toggleCommentReaction(commentId: string, emoji: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!(REACTION_EMOJI as readonly string[]).includes(emoji)) throw new Error("Invalid reaction");

  const comment = await prisma.blogComment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comment not found");

  const existing = await prisma.blogCommentReaction.findUnique({
    where: { commentId_userId_emoji: { commentId, userId: user.id, emoji } },
  });

  if (existing) {
    await prisma.blogCommentReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.blogCommentReaction.create({ data: { commentId, userId: user.id, emoji } });
  }

  revalidatePath(`/blog/${comment.postId}`);
}

export async function deleteComment(commentId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  const comment = await prisma.blogComment.findUnique({ where: { id: commentId } });
  if (!comment) return;
  if (comment.authorId !== user.id && user.role !== "ADMIN") {
    throw new Error("You can only delete your own comments");
  }

  await prisma.blogComment.delete({ where: { id: commentId } });
  revalidatePath(`/blog/${comment.postId}`);
}
