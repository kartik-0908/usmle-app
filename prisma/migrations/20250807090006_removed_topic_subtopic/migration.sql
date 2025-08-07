/*
  Warnings:

  - You are about to drop the `custom_practice_set_topics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question_subtopics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question_topics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subtopics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `topics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_topic_progress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."custom_practice_set_topics" DROP CONSTRAINT "custom_practice_set_topics_customPracticeSetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."custom_practice_set_topics" DROP CONSTRAINT "custom_practice_set_topics_topicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."question_subtopics" DROP CONSTRAINT "question_subtopics_questionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."question_subtopics" DROP CONSTRAINT "question_subtopics_subtopicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."question_topics" DROP CONSTRAINT "question_topics_questionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."question_topics" DROP CONSTRAINT "question_topics_topicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."subtopics" DROP CONSTRAINT "subtopics_topicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."topics" DROP CONSTRAINT "topics_stepId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_topic_progress" DROP CONSTRAINT "user_topic_progress_topicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_topic_progress" DROP CONSTRAINT "user_topic_progress_userId_fkey";

-- DropTable
DROP TABLE "public"."custom_practice_set_topics";

-- DropTable
DROP TABLE "public"."question_subtopics";

-- DropTable
DROP TABLE "public"."question_topics";

-- DropTable
DROP TABLE "public"."subtopics";

-- DropTable
DROP TABLE "public"."topics";

-- DropTable
DROP TABLE "public"."user_topic_progress";
