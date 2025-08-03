-- CreateEnum
CREATE TYPE "PracticeSetStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED');

-- CreateTable
CREATE TABLE "custom_practice_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalQuestions" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "custom_practice_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_practice_set_topics" (
    "customPracticeSetId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_practice_set_topics_pkey" PRIMARY KEY ("customPracticeSetId","topicId")
);

-- CreateTable
CREATE TABLE "user_custom_practice_sets" (
    "id" TEXT NOT NULL,
    "status" "PracticeSetStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "score" INTEGER,
    "questionsAttempted" INTEGER NOT NULL DEFAULT 0,
    "questionsCorrect" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "customPracticeSetId" TEXT NOT NULL,

    CONSTRAINT "user_custom_practice_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_custom_practice_questions" (
    "id" TEXT NOT NULL,
    "userCustomPracticeSetId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_custom_practice_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_practice_sets_userId_isActive_createdAt_idx" ON "custom_practice_sets"("userId", "isActive", "createdAt");

-- CreateIndex
CREATE INDEX "custom_practice_sets_isActive_createdAt_idx" ON "custom_practice_sets"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "custom_practice_set_topics_topicId_idx" ON "custom_practice_set_topics"("topicId");

-- CreateIndex
CREATE INDEX "custom_practice_set_topics_customPracticeSetId_idx" ON "custom_practice_set_topics"("customPracticeSetId");

-- CreateIndex
CREATE INDEX "user_custom_practice_sets_userId_status_idx" ON "user_custom_practice_sets"("userId", "status");

-- CreateIndex
CREATE INDEX "user_custom_practice_sets_customPracticeSetId_status_idx" ON "user_custom_practice_sets"("customPracticeSetId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_custom_practice_sets_userId_customPracticeSetId_key" ON "user_custom_practice_sets"("userId", "customPracticeSetId");

-- CreateIndex
CREATE INDEX "user_custom_practice_questions_userCustomPracticeSetId_orde_idx" ON "user_custom_practice_questions"("userCustomPracticeSetId", "order");

-- CreateIndex
CREATE INDEX "user_custom_practice_questions_questionId_idx" ON "user_custom_practice_questions"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_custom_practice_questions_userCustomPracticeSetId_ques_key" ON "user_custom_practice_questions"("userCustomPracticeSetId", "questionId");

-- AddForeignKey
ALTER TABLE "custom_practice_sets" ADD CONSTRAINT "custom_practice_sets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_practice_set_topics" ADD CONSTRAINT "custom_practice_set_topics_customPracticeSetId_fkey" FOREIGN KEY ("customPracticeSetId") REFERENCES "custom_practice_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_practice_set_topics" ADD CONSTRAINT "custom_practice_set_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_custom_practice_sets" ADD CONSTRAINT "user_custom_practice_sets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_custom_practice_sets" ADD CONSTRAINT "user_custom_practice_sets_customPracticeSetId_fkey" FOREIGN KEY ("customPracticeSetId") REFERENCES "custom_practice_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_custom_practice_questions" ADD CONSTRAINT "user_custom_practice_questions_userCustomPracticeSetId_fkey" FOREIGN KEY ("userCustomPracticeSetId") REFERENCES "user_custom_practice_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_custom_practice_questions" ADD CONSTRAINT "user_custom_practice_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
