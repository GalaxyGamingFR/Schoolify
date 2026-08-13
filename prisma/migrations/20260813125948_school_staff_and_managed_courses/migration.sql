-- CreateEnum
CREATE TYPE "SchoolRole" AS ENUM ('PRINCIPAL', 'TEACHER');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('INVITED', 'ACTIVE');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "joinCode" TEXT,
ADD COLUMN     "teacherId" TEXT;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "domain" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SchoolStaff" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "role" "SchoolRole" NOT NULL,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolStaff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchoolStaff_userId_idx" ON "SchoolStaff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolStaff_schoolId_email_key" ON "SchoolStaff"("schoolId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Course_joinCode_key" ON "Course"("joinCode");

-- CreateIndex
CREATE INDEX "Course_teacherId_idx" ON "Course"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "School_domain_key" ON "School"("domain");

-- AddForeignKey
ALTER TABLE "SchoolStaff" ADD CONSTRAINT "SchoolStaff_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolStaff" ADD CONSTRAINT "SchoolStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

