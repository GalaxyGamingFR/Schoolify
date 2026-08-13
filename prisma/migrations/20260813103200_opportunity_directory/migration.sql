-- CreateEnum
CREATE TYPE "OpportunitySubject" AS ENUM ('STEM', 'MATH', 'SCIENCE', 'COMPUTER_SCIENCE', 'ENGINEERING', 'BUSINESS', 'WRITING', 'DEBATE', 'ARTS', 'GENERAL');

-- CreateEnum
CREATE TYPE "PrizeTier" AS ENUM ('RECOGNITION', 'SMALL', 'MEDIUM', 'LARGE', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "subject" "OpportunitySubject" NOT NULL,
    "minGrade" INTEGER,
    "maxGrade" INTEGER,
    "typicalDeadlineMonth" INTEGER,
    "deadlineNote" TEXT NOT NULL,
    "prizeTier" "PrizeTier" NOT NULL DEFAULT 'UNKNOWN',
    "prizeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Opportunity_subject_idx" ON "Opportunity"("subject");

-- CreateIndex
CREATE INDEX "Opportunity_prizeTier_idx" ON "Opportunity"("prizeTier");
