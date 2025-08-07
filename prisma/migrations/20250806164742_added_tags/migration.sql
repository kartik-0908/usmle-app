-- CreateEnum
CREATE TYPE "public"."System" AS ENUM ('CARDIOVASCULAR', 'RESPIRATORY', 'NEUROLOGICAL', 'GASTROINTESTINAL', 'MUSCULOSKELETAL', 'ENDOCRINE', 'GENITOURINARY', 'HEMATOLOGIC', 'INFECTIOUS_DISEASE', 'PSYCHIATRY', 'DERMATOLOGY', 'OPHTHALMOLOGY', 'OTOLARYNGOLOGY', 'EMERGENCY_MEDICINE', 'PEDIATRICS', 'OBSTETRICS_GYNECOLOGY', 'SURGERY', 'PHARMACOLOGY', 'PATHOLOGY', 'RADIOLOGY');

-- CreateEnum
CREATE TYPE "public"."Discipline" AS ENUM ('INTERNAL_MEDICINE', 'SURGERY', 'PEDIATRICS', 'OBSTETRICS_GYNECOLOGY', 'PSYCHIATRY', 'FAMILY_MEDICINE', 'EMERGENCY_MEDICINE', 'RADIOLOGY', 'PATHOLOGY', 'ANESTHESIOLOGY', 'DERMATOLOGY', 'OPHTHALMOLOGY', 'OTOLARYNGOLOGY', 'ORTHOPEDICS', 'UROLOGY', 'NEUROLOGY', 'CARDIOLOGY', 'PULMONOLOGY', 'GASTROENTEROLOGY', 'NEPHROLOGY', 'RHEUMATOLOGY', 'ENDOCRINOLOGY', 'HEMATOLOGY_ONCOLOGY', 'INFECTIOUS_DISEASE');

-- AlterTable
ALTER TABLE "public"."questions" ADD COLUMN     "discipline" "public"."Discipline",
ADD COLUMN     "system" "public"."System",
ALTER COLUMN "isActive" SET DEFAULT false;

-- CreateTable
CREATE TABLE "public"."tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."question_tags" (
    "questionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_tags_pkey" PRIMARY KEY ("questionId","tagId")
);

-- CreateTable
CREATE TABLE "public"."user_question_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "isMarked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_question_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "public"."tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "public"."tags"("slug");

-- CreateIndex
CREATE INDEX "tags_isActive_name_idx" ON "public"."tags"("isActive", "name");

-- CreateIndex
CREATE INDEX "tags_slug_isActive_idx" ON "public"."tags"("slug", "isActive");

-- CreateIndex
CREATE INDEX "question_tags_tagId_idx" ON "public"."question_tags"("tagId");

-- CreateIndex
CREATE INDEX "question_tags_questionId_idx" ON "public"."question_tags"("questionId");

-- CreateIndex
CREATE INDEX "question_tags_tagId_createdAt_idx" ON "public"."question_tags"("tagId", "createdAt");

-- CreateIndex
CREATE INDEX "user_question_states_userId_isUsed_idx" ON "public"."user_question_states"("userId", "isUsed");

-- CreateIndex
CREATE INDEX "user_question_states_userId_isMarked_idx" ON "public"."user_question_states"("userId", "isMarked");

-- CreateIndex
CREATE INDEX "user_question_states_questionId_isUsed_idx" ON "public"."user_question_states"("questionId", "isUsed");

-- CreateIndex
CREATE UNIQUE INDEX "user_question_states_userId_questionId_key" ON "public"."user_question_states"("userId", "questionId");

-- CreateIndex
CREATE INDEX "questions_isActive_system_idx" ON "public"."questions"("isActive", "system");

-- CreateIndex
CREATE INDEX "questions_isActive_discipline_idx" ON "public"."questions"("isActive", "discipline");

-- CreateIndex
CREATE INDEX "questions_system_discipline_isActive_idx" ON "public"."questions"("system", "discipline", "isActive");

-- CreateIndex
CREATE INDEX "user_attempts_userId_isCorrect_attemptedAt_idx" ON "public"."user_attempts"("userId", "isCorrect", "attemptedAt");

-- AddForeignKey
ALTER TABLE "public"."question_tags" ADD CONSTRAINT "question_tags_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."question_tags" ADD CONSTRAINT "question_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_question_states" ADD CONSTRAINT "user_question_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_question_states" ADD CONSTRAINT "user_question_states_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
