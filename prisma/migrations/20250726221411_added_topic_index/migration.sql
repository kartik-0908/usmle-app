-- CreateIndex
CREATE INDEX "question_topics_topicId_questionId_idx" ON "question_topics"("topicId", "questionId");
