/*
  Warnings:

  - You are about to drop the column `description` on the `topics` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `topics` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `topics` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "topics_name_key";

-- AlterTable
ALTER TABLE "topics" DROP COLUMN "description",
ADD COLUMN     "slug" TEXT NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");
