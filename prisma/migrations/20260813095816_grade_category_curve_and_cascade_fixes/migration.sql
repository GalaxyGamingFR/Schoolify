-- DropForeignKey
ALTER TABLE "GradeEntry" DROP CONSTRAINT "GradeEntry_categoryId_fkey";

-- AlterTable
ALTER TABLE "GradeCategory" ADD COLUMN     "curveAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "GradeEntry" ADD CONSTRAINT "GradeEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GradeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
