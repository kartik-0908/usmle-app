/*
  Warnings:

  - You are about to drop the column `description` on the `subtopics` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `subtopics` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `subtopics` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "subtopics" DROP COLUMN "description",
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "subtopics_slug_key" ON "subtopics"("slug");
