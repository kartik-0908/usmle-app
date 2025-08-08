/*
  Warnings:

  - You are about to drop the `problem_set_questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `problem_sets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_problem_sets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."problem_set_questions" DROP CONSTRAINT "problem_set_questions_problemSetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."problem_set_questions" DROP CONSTRAINT "problem_set_questions_questionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_problem_sets" DROP CONSTRAINT "user_problem_sets_problemSetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_problem_sets" DROP CONSTRAINT "user_problem_sets_userId_fkey";

-- DropTable
DROP TABLE "public"."problem_set_questions";

-- DropTable
DROP TABLE "public"."problem_sets";

-- DropTable
DROP TABLE "public"."user_problem_sets";
