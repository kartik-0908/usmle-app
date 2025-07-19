/*
  Warnings:

  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_problem_sets" DROP CONSTRAINT "user_problem_sets_userId_fkey";

-- DropIndex
DROP INDEX "users_username_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "username";

-- AddForeignKey
ALTER TABLE "user_problem_sets" ADD CONSTRAINT "user_problem_sets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
