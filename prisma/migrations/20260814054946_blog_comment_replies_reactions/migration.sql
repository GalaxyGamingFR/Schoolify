-- AlterTable
ALTER TABLE "BlogComment" ADD COLUMN     "parentId" TEXT;

-- CreateTable
CREATE TABLE "BlogCommentReaction" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogCommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogCommentReaction_commentId_idx" ON "BlogCommentReaction"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCommentReaction_commentId_userId_emoji_key" ON "BlogCommentReaction"("commentId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "BlogComment_parentId_idx" ON "BlogComment"("parentId");

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BlogComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogCommentReaction" ADD CONSTRAINT "BlogCommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "BlogComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogCommentReaction" ADD CONSTRAINT "BlogCommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
