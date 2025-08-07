/*
  Warnings:

  - The `discipline` column on the `questions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `system` column on the `questions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."questions" DROP COLUMN "discipline",
ADD COLUMN     "discipline" TEXT,
DROP COLUMN "system",
ADD COLUMN     "system" TEXT;

-- DropEnum
DROP TYPE "public"."Discipline";

-- DropEnum
DROP TYPE "public"."System";

-- CreateIndex
CREATE INDEX "questions_isActive_system_idx" ON "public"."questions"("isActive", "system");

-- CreateIndex
CREATE INDEX "questions_isActive_discipline_idx" ON "public"."questions"("isActive", "discipline");

-- CreateIndex
CREATE INDEX "questions_system_discipline_isActive_idx" ON "public"."questions"("system", "discipline", "isActive");
