-- AlterTable
ALTER TABLE "users" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "medicalSchool" TEXT,
ADD COLUMN     "stepExam" TEXT,
ADD COLUMN     "yearOfPassing" INTEGER;

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subtopicId" TEXT NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_branches" (
    "questionId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_branches_pkey" PRIMARY KEY ("questionId","branchId")
);

-- CreateTable
CREATE TABLE "user_branch_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "questionsAttempted" INTEGER NOT NULL DEFAULT 0,
    "questionsCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_branch_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_slug_key" ON "branches"("slug");

-- CreateIndex
CREATE INDEX "branches_slug_isActive_idx" ON "branches"("slug", "isActive");

-- CreateIndex
CREATE INDEX "branches_subtopicId_isActive_order_idx" ON "branches"("subtopicId", "isActive", "order");

-- CreateIndex
CREATE INDEX "branches_isActive_createdAt_idx" ON "branches"("isActive", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "branches_subtopicId_name_key" ON "branches"("subtopicId", "name");

-- CreateIndex
CREATE INDEX "question_branches_branchId_idx" ON "question_branches"("branchId");

-- CreateIndex
CREATE INDEX "question_branches_questionId_idx" ON "question_branches"("questionId");

-- CreateIndex
CREATE INDEX "question_branches_branchId_createdAt_idx" ON "question_branches"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "user_branch_progress_userId_lastPracticedAt_idx" ON "user_branch_progress"("userId", "lastPracticedAt");

-- CreateIndex
CREATE INDEX "user_branch_progress_branchId_questionsCorrect_idx" ON "user_branch_progress"("branchId", "questionsCorrect");

-- CreateIndex
CREATE UNIQUE INDEX "user_branch_progress_userId_branchId_key" ON "user_branch_progress"("userId", "branchId");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "subtopics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_branches" ADD CONSTRAINT "question_branches_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_branches" ADD CONSTRAINT "question_branches_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branch_progress" ADD CONSTRAINT "user_branch_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branch_progress" ADD CONSTRAINT "user_branch_progress_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
