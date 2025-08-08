/*
  Warnings:

  - You are about to drop the column `questionsAttempted` on the `user_custom_practice_sets` table. All the data in the column will be lost.
  - You are about to drop the column `questionsCorrect` on the `user_custom_practice_sets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."user_custom_practice_sets" DROP COLUMN "questionsAttempted",
DROP COLUMN "questionsCorrect";
