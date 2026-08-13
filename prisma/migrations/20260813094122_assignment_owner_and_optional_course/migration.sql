/*
  Warnings:

  - Added the required column `userId` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_courseId_fkey";

-- DropIndex
DROP INDEX "Assignment_courseId_dueAt_idx";

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "courseId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Assignment_userId_dueAt_idx" ON "Assignment"("userId", "dueAt");

-- CreateIndex
CREATE INDEX "Assignment_courseId_idx" ON "Assignment"("courseId");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
