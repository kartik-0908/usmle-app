-- CreateTable
CREATE TABLE "public"."step_systems" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "step_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."step_disciplines" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "step_disciplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."question_systems" (
    "questionId" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_systems_pkey" PRIMARY KEY ("questionId","system")
);

-- CreateTable
CREATE TABLE "public"."question_disciplines" (
    "questionId" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_disciplines_pkey" PRIMARY KEY ("questionId","discipline")
);

-- CreateIndex
CREATE INDEX "step_systems_stepId_isActive_order_idx" ON "public"."step_systems"("stepId", "isActive", "order");

-- CreateIndex
CREATE INDEX "step_systems_system_isActive_idx" ON "public"."step_systems"("system", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "step_systems_stepId_system_key" ON "public"."step_systems"("stepId", "system");

-- CreateIndex
CREATE INDEX "step_disciplines_stepId_isActive_order_idx" ON "public"."step_disciplines"("stepId", "isActive", "order");

-- CreateIndex
CREATE INDEX "step_disciplines_discipline_isActive_idx" ON "public"."step_disciplines"("discipline", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "step_disciplines_stepId_discipline_key" ON "public"."step_disciplines"("stepId", "discipline");

-- CreateIndex
CREATE INDEX "question_systems_system_idx" ON "public"."question_systems"("system");

-- CreateIndex
CREATE INDEX "question_systems_questionId_idx" ON "public"."question_systems"("questionId");

-- CreateIndex
CREATE INDEX "question_systems_system_createdAt_idx" ON "public"."question_systems"("system", "createdAt");

-- CreateIndex
CREATE INDEX "question_disciplines_discipline_idx" ON "public"."question_disciplines"("discipline");

-- CreateIndex
CREATE INDEX "question_disciplines_questionId_idx" ON "public"."question_disciplines"("questionId");

-- CreateIndex
CREATE INDEX "question_disciplines_discipline_createdAt_idx" ON "public"."question_disciplines"("discipline", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."step_systems" ADD CONSTRAINT "step_systems_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "public"."steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."step_disciplines" ADD CONSTRAINT "step_disciplines_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "public"."steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."question_systems" ADD CONSTRAINT "question_systems_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."question_disciplines" ADD CONSTRAINT "question_disciplines_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
