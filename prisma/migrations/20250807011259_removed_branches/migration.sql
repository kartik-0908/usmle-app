/*
  Warnings:

  - You are about to drop the `branches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question_branches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_branch_progress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."branches" DROP CONSTRAINT "branches_subtopicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."question_branches" DROP CONSTRAINT "question_branches_branchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."question_branches" DROP CONSTRAINT "question_branches_questionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_branch_progress" DROP CONSTRAINT "user_branch_progress_branchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_branch_progress" DROP CONSTRAINT "user_branch_progress_userId_fkey";

-- DropTable
DROP TABLE "public"."branches";

-- DropTable
DROP TABLE "public"."question_branches";

-- DropTable
DROP TABLE "public"."user_branch_progress";
