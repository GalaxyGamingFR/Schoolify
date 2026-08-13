-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('CLUB', 'VOLUNTEER', 'LEADERSHIP', 'SUMMER_PROGRAM', 'AWARD', 'WORK', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('RESEARCHING', 'APPLYING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'WAITLISTED', 'DECLINED');

-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "offersScholarship" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT,
    "category" "ActivityCategory" NOT NULL DEFAULT 'OTHER',
    "role" TEXT,
    "description" TEXT,
    "hoursTotal" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityTarget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applicationDeadline" TIMESTAMP(3),
    "status" "ApplicationStatus" NOT NULL DEFAULT 'RESEARCHING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniversityTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationTask" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DegreeRequirement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT,
    "creditsRequired" DOUBLE PRECISION NOT NULL,
    "creditsCompleted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "requiresId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DegreeRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "UniversityTarget_userId_idx" ON "UniversityTarget"("userId");

-- CreateIndex
CREATE INDEX "ApplicationTask_targetId_idx" ON "ApplicationTask"("targetId");

-- CreateIndex
CREATE INDEX "DegreeRequirement_userId_idx" ON "DegreeRequirement"("userId");

-- CreateIndex
CREATE INDEX "DegreeRequirement_requiresId_idx" ON "DegreeRequirement"("requiresId");

-- CreateIndex
CREATE INDEX "Opportunity_offersScholarship_idx" ON "Opportunity"("offersScholarship");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityTarget" ADD CONSTRAINT "UniversityTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTask" ADD CONSTRAINT "ApplicationTask_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "UniversityTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegreeRequirement" ADD CONSTRAINT "DegreeRequirement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegreeRequirement" ADD CONSTRAINT "DegreeRequirement_requiresId_fkey" FOREIGN KEY ("requiresId") REFERENCES "DegreeRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

