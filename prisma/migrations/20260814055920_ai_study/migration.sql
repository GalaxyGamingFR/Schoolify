-- CreateEnum
CREATE TYPE "StudySourceType" AS ENUM ('TEXT', 'DOCUMENT', 'AUDIO', 'YOUTUBE', 'WEBSITE');

-- CreateEnum
CREATE TYPE "StudyJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "StudySet" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "status" "StudyJobStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudySet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySource" (
    "id" TEXT NOT NULL,
    "studySetId" TEXT NOT NULL,
    "type" "StudySourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudySource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyChatMessage" (
    "id" TEXT NOT NULL,
    "studySetId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyQuiz" (
    "id" TEXT NOT NULL,
    "studySetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyQuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "choices" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT,

    CONSTRAINT "StudyQuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyFlashcardDeck" (
    "id" TEXT NOT NULL,
    "studySetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyFlashcardDeck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyFlashcard" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,

    CONSTRAINT "StudyFlashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyPodcast" (
    "id" TEXT NOT NULL,
    "studySetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "audioUrl" TEXT,
    "status" "StudyJobStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyPodcast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudySet_ownerId_createdAt_idx" ON "StudySet"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "StudySource_studySetId_idx" ON "StudySource"("studySetId");

-- CreateIndex
CREATE INDEX "StudyChatMessage_studySetId_createdAt_idx" ON "StudyChatMessage"("studySetId", "createdAt");

-- CreateIndex
CREATE INDEX "StudyQuiz_studySetId_idx" ON "StudyQuiz"("studySetId");

-- CreateIndex
CREATE INDEX "StudyQuizQuestion_quizId_idx" ON "StudyQuizQuestion"("quizId");

-- CreateIndex
CREATE INDEX "StudyFlashcardDeck_studySetId_idx" ON "StudyFlashcardDeck"("studySetId");

-- CreateIndex
CREATE INDEX "StudyFlashcard_deckId_idx" ON "StudyFlashcard"("deckId");

-- CreateIndex
CREATE INDEX "StudyPodcast_studySetId_idx" ON "StudyPodcast"("studySetId");

-- AddForeignKey
ALTER TABLE "StudySet" ADD CONSTRAINT "StudySet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySource" ADD CONSTRAINT "StudySource_studySetId_fkey" FOREIGN KEY ("studySetId") REFERENCES "StudySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyChatMessage" ADD CONSTRAINT "StudyChatMessage_studySetId_fkey" FOREIGN KEY ("studySetId") REFERENCES "StudySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyQuiz" ADD CONSTRAINT "StudyQuiz_studySetId_fkey" FOREIGN KEY ("studySetId") REFERENCES "StudySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyQuizQuestion" ADD CONSTRAINT "StudyQuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "StudyQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyFlashcardDeck" ADD CONSTRAINT "StudyFlashcardDeck_studySetId_fkey" FOREIGN KEY ("studySetId") REFERENCES "StudySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyFlashcard" ADD CONSTRAINT "StudyFlashcard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "StudyFlashcardDeck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPodcast" ADD CONSTRAINT "StudyPodcast_studySetId_fkey" FOREIGN KEY ("studySetId") REFERENCES "StudySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
