-- CreateTable
CREATE TABLE "steps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "steps_slug_key" ON "steps"("slug");
CREATE UNIQUE INDEX "steps_stepNumber_key" ON "steps"("stepNumber");

-- Insert default step (you can modify this based on your needs)
INSERT INTO "steps" ("id", "name", "slug", "stepNumber", "description", "order", "isActive", "createdAt", "updatedAt") 
VALUES (
    gen_random_uuid()::text, 
    'Step 1: Foundation', 
    'step-1-foundation', 
    1, 
    'Basic foundational topics', 
    1, 
    true, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
);

-- Add stepId column to topics table (nullable first)
ALTER TABLE "topics" ADD COLUMN "stepId" TEXT;

-- Update existing topics to reference the default step
UPDATE "topics" 
SET "stepId" = (SELECT "id" FROM "steps" WHERE "stepNumber" = 1 LIMIT 1);

-- Make stepId column required (NOT NULL)
ALTER TABLE "topics" ALTER COLUMN "stepId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "topics" ADD CONSTRAINT "topics_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create unique constraint for topic names within steps
CREATE UNIQUE INDEX "topics_stepId_name_key" ON "topics"("stepId", "name");

-- CreateTable for UserStepProgress
CREATE TABLE "user_step_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "questionsAttempted" INTEGER NOT NULL DEFAULT 0,
    "questionsCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_step_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_step_progress_userId_stepId_key" ON "user_step_progress"("userId", "stepId");

-- AddForeignKey
ALTER TABLE "user_step_progress" ADD CONSTRAINT "user_step_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_step_progress" ADD CONSTRAINT "user_step_progress_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;