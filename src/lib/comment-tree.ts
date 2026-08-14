export type CommentData = {
  id: string;
  body: string;
  createdAt: Date;
  authorId: string;
  author: { name: string };
  reactions: { emoji: string; userId: string }[];
  replies?: CommentData[];
};

// Comments are only one level deep (a reply can't itself be replied to --
// see the schema comment on BlogComment.parentId), so these never need to
// recurse past `replies`.
export function addToTree(prev: CommentData[], comment: CommentData, parentId?: string): CommentData[] {
  if (!parentId) return [...prev, comment];
  return prev.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies ?? []), comment] } : c));
}

export function replaceInTree(
  prev: CommentData[],
  tempId: string,
  real: CommentData,
  parentId?: string,
): CommentData[] {
  if (!parentId) return prev.map((c) => (c.id === tempId ? real : c));
  return prev.map((c) =>
    c.id === parentId ? { ...c, replies: (c.replies ?? []).map((r) => (r.id === tempId ? real : r)) } : c,
  );
}

export function removeFromTree(prev: CommentData[], id: string, parentId?: string): CommentData[] {
  if (!parentId) return prev.filter((c) => c.id !== id);
  return prev.map((c) =>
    c.id === parentId ? { ...c, replies: (c.replies ?? []).filter((r) => r.id !== id) } : c,
  );
}

export function countComments(comments: CommentData[]): number {
  return comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);
}
